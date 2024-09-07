from fastapi import FastAPI
from fastapi.responses import JSONResponse
from src.rag import get_answer_and_docs
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(
    title="Rag API",
    version="0.1",
    description="a simple rag API"
)
origins=[
    "http://localhost:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
)
class Message:
    message:str

@app.post("/chat")
def chat(message: Message):
    response=get_answer_and_docs(message)
    response_content={
        "question":message,
        "answer":response
    }
    return JSONResponse(content=response_content,status_code=200)

