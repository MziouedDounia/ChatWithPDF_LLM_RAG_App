import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
import asyncio
from contextlib import asynccontextmanager

from src.rag import get_answer_and_docs, DualLanguageDetector, welcomeUser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory session store to hold session metadata (not chat history)
session_store = {}

# Session expiration time (24 hours)
session_expiration_time = 24 * 60 * 60  # 24 hours

# Initialize the language detector
detector = DualLanguageDetector()

# Cleanup function to remove expired sessions
async def cleanup_sessions():
    current_time = time.time()
    expired_sessions = []

    # Check each session for expiration
    for session_id, session_data in session_store.items():
        last_active = session_data.get("last_active", current_time)
        if current_time - last_active > session_expiration_time:
            expired_sessions.append(session_id)

    # Remove expired sessions
    for session_id in expired_sessions:
        del session_store[session_id]
        logger.info(f"Session {session_id} has been cleaned up.")

# Function to run session cleanup periodically
async def periodic_cleanup():
    while True:
        await cleanup_sessions()
        await asyncio.sleep(7200)  # Run every 2hour

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize the language detector and schedule the periodic cleanup task
    detector.warm_up()
    logger.info("Language detector warmed up")
    cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # Shutdown: cancel the cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

# Initialize FastAPI application with lifespan
app = FastAPI(
    title="RAG API",
    version="0.1",
    description="A simple RAG API for fluid conversations",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Frontend running on this port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Message(BaseModel):
    message: str
    session_id: str  # Session ID is now required


class WelcomeRequest(BaseModel):
    session_id: str
    name: Optional[str] = None
    
# Function to get or create session metadata (not chat history)
def get_session_metadata(session_id: str):
    if session_id not in session_store:
        # Initialize session metadata with last_active timestamp
        session_store[session_id] = {
            "last_active": time.time()
        }
    return session_store[session_id]

# API Endpoint to start a new session
@app.post("/start_session")
def start_session():
    session_id = str(uuid.uuid4())  # Generate a new session ID
    session_store[session_id] = {"last_active": time.time()}  # Initialize session metadata
    return {"session_id": session_id}

# API Endpoint to handle chat messages
@app.post("/chat")
async def chat(message: Message):
    if not message.session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")

    try:
        # Update last active timestamp for session
        session_metadata = get_session_metadata(message.session_id)
        session_metadata['last_active'] = time.time()

        # Call your function in rag.py to process the message and generate a response
        answer, detected_language = await get_answer_and_docs(message.message, message.session_id)

        # Prepare the response content
        response_content = {
            "answer": answer,
            "detected_language": detected_language,
        }

        return JSONResponse(content=response_content, status_code=200)

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        
        error_response = {
            "error": "An error occurred while processing your request.",
            "session_id": message.session_id
        }
        return JSONResponse(content=error_response, status_code=500)

@app.post("/welcome_user")
async def welcome_user(request: WelcomeRequest):
    logger.info(f"Raw request data: {request.dict()}")
    logger.info(f"Received welcome_user request with session_id: {request.session_id} and name: {request.name}")
    logger.info(f"Received welcome_user request with session_id: {request.session_id} and name: {request.name}")
    if request.session_id not in session_store:
        logger.warning(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found.")
    
    # Update last active timestamp for session
    session_metadata = get_session_metadata(request.session_id)
    session_metadata['last_active'] = time.time()
    
    try:
        name = request.name if request.name and request.name.strip() else None
        welcome_message = await welcomeUser(name, request.session_id)
        logger.info(f"Generated welcome message: {welcome_message}")
        
        return JSONResponse(content={
            "welcome_message": welcome_message
        }, status_code=200)
    
    except Exception as e:
        logger.error(f"Error in welcome_user endpoint: {str(e)}", exc_info=True)
        
        error_response = {
            "error": "An error occurred while generating the welcome message.",
            "session_id": request.session_id
        }
        return JSONResponse(content=error_response, status_code=500)
    
# API Endpoint to retrieve session metadata (this doesn't return chat history)
@app.get("/session_metadata/{session_id}")
async def get_session_info(session_id: str):
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session_store[session_id]

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error(f"Validation error. Request body: {body.decode()}")
    logger.error(f"Validation error details: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )