from fastapi import FastAPI
from fastapi.responses import JSONResponse
from rag import get_answer_and_docs
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 

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


class Message(BaseModel):
    message: str


@app.post("/chat")
def chat(message: Message) -> JSONResponse:
    response=get_answer_and_docs(message)
    response_content={
        "question":message,
        "answer":response
    }
    return JSONResponse(content=response_content,status_code=200)

