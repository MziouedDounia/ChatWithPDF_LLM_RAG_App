from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import uuid
import threading

from src.rag import get_answer_and_docs

# In-memory session store to hold chat history
session_store: Dict[str, List[Dict[str, str]]] = {}

# Session expiration time (e.g., 1 hour)
session_expiration_time = 3600  # 1 hour

# Cleanup function to remove expired sessions
def cleanup_sessions():
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
        print(f"Session {session_id} has been cleaned up.")

# Function to run session cleanup periodically in a separate thread
def periodic_cleanup():
    while True:
        cleanup_sessions()
        time.sleep(60)  # Run every 60 seconds (you can adjust this)

# Initialize FastAPI application
app = FastAPI(
    title="RAG API",
    version="0.1",
    description="A simple RAG API for fluid conversations"
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Frontend running on this port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifespan event to handle startup and shutdown of the app
@app.on_event("startup")
async def start_background_tasks():
    # Start the background thread for periodic session cleanup
    cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
    cleanup_thread.start()

# Pydantic model for incoming messages
class Message(BaseModel):
    message: str
    session_id: Optional[str] = None  # Session ID is optional for new users

# Function to get or create user-specific chat history
def get_session_history(session_id: str) -> List[Dict[str, str]]:
    if session_id not in session_store:
        session_store[session_id] = []  # Initialize session history if it doesn't exist
    return session_store[session_id]

# API Endpoint to start a new session
@app.post("/start_session")
def start_session():
    session_id = str(uuid.uuid4())  # Generate a new session ID
    session_store[session_id] = {"last_active": time.time()}  # Initialize session with last active time
    return {"session_id": session_id}

# API Endpoint to handle chat messages
@app.post("/chat")
def chat(message: Message):
    # If no session_id is provided, raise an error
    if not message.session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")

    # Get user-specific chat history
    chat_history = get_session_history(message.session_id)

    # Update last active timestamp for session
    session_store[message.session_id]['last_active'] = time.time()

    # Call your function to process the message and generate a response
    response_text = get_answer_and_docs(message.message, message.session_id)

    # Add the question and answer to the session's chat history
    chat_history.append({"question": message.message, "answer": response_text})

    response_content = {
        "question": message.message,
        "answer": response_text,
        "session_id": message.session_id  # Return session ID for client-side tracking
    }

    return JSONResponse(content=response_content, status_code=200)

# API Endpoint to retrieve session history
@app.get("/history/{session_id}", response_model=List[Dict[str, str]])
async def get_history(session_id: str):
    # Retrieve history for a specific session
    chat_history = get_session_history(session_id)
    if not chat_history:
        raise HTTPException(status_code=404, detail="No history found for this session.")
    return chat_history
