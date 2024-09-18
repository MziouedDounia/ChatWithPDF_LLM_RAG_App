import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
import asyncio
from contextlib import asynccontextmanager

from src.rag import get_answer_and_docs, DualLanguageDetector
logger = logging.getLogger(__name__)

# In-memory session store to hold session metadata (not chat history)
session_store = {}

# Session expiration time (e.g., 1 hour)
session_expiration_time = 3600  # 1 hour

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
        await asyncio.sleep(4320)  # Run every 60 seconds (you can adjust this)

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

# Pydantic model for incoming messages
class Message(BaseModel):
    message: str
    session_id: str  # Session ID is now required

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
            "question": message.message,
            "answer": answer,
            "detected_language": detected_language,
            "session_id": message.session_id
        }

        return JSONResponse(content=response_content, status_code=200)

    except Exception as e:
        # Log the error
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        
        # Return a generic error message to the client
        error_response = {
            "error": "An error occurred while processing your request.",
            "session_id": message.session_id
        }
        return JSONResponse(content=error_response, status_code=500)

# API Endpoint to retrieve session metadata (this doesn't return chat history)
@app.get("/session_metadata/{session_id}")
async def get_session_info(session_id: str):
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session_store[session_id]