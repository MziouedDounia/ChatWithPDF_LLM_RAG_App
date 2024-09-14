import os
import subprocess
from typing import Dict, List
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from src.rag import get_answer_and_docs
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Rag API",
    version="0.1",
    description="A simple RAG API"
)

# Configure CORS
origins = [
    "http://localhost:5174",  # Frontend running on this port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_history: List[Dict[str, str]] = []

class Message(BaseModel):
    message: str

@app.post("/chat")
def chat(message: Message):
    response = get_answer_and_docs(message.message)  # Access the 'message' attribute of the Message object
    response_content = {
        "question": message.message,  # Send the original message
        "answer": response
    }    
    chat_history.append({"role": "user", "message": message.message})
    chat_history.append({"role": "system", "message": response})

    return JSONResponse(content=response_content, status_code=200)

@app.get("/history", response_model=List[dict])
async def get_history():
    return chat_history

@app.post("/save_audio")
async def save_audio(file: UploadFile = File(...)):
    audio_path = os.path.join("r3frontend", "public", "audios", file.filename)
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    with open(audio_path, "wb") as audio_file:
        audio_file.write(await file.read())

    # Verify the audio file is a valid WAVE file
    try:
        subprocess.run(["ffmpeg", "-v", "error", "-i", audio_path, "-f", "wav", "-"], check=True)
    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"message": "Invalid WAVE file", "error": str(e)}, status_code=400)

    # Generate lip sync JSON using Rhubarb Lip Sync
    json_path = os.path.splitext(audio_path)[0] + ".json"
    rhubarb_executable = os.path.join("C:", "Users", "Dounia", "ChatWithPDF_LLM_RAG_App", "r3frontend", "Rhubarb-Lip-Sync-1.13.0-Windows", "Rhubarb-Lip-Sync-1.13.0-Windows", "rhubarb.exe")
    try:
        # Ensure the correct usage of the Rhubarb Lip Sync command
        subprocess.run([rhubarb_executable, "-f", "json", audio_path, "-o", json_path], check=True)
    except FileNotFoundError:
        return JSONResponse(content={"message": "Rhubarb Lip Sync executable not found. Ensure it is installed and in the system's PATH."}, status_code=500)
    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"message": "Failed to generate lip sync JSON", "error": str(e)}, status_code=500)

    return JSONResponse(content={"message": "Audio and lip sync JSON saved successfully", "audio_path": audio_path, "json_path": json_path}, status_code=200)