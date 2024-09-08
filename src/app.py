from fastapi import FastAPI
from fastapi.responses import JSONResponse
from rag import get_answer_and_docs
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Rag API",
    version="0.1",
    description="A simple RAG API"
)

# Configure CORS
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

class Message(BaseModel):
    message: str

@app.post("/chat")
def chat(message: Message):
    response = get_answer_and_docs(message.message)  # Access the 'message' attribute of the Message object
    response_content = {
        "question": message.message,  # Send the original message
        "answer": response
    }
    return JSONResponse(content=response_content, status_code=200)
