from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from dotenv import load_dotenv
from functools import lru_cache
from langchain_core.messages import  AIMessage , HumanMessage

import logging
import os

# Load environment variables from .env file
load_dotenv()

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")

# Ensure API key is set
if os.environ["LANGCHAIN_API_KEY"] is None:
    raise ValueError("LANGCHAIN_API_KEY is not set. Please check your .env file.")

# Initialize the LLM with ChatOllama
llm = ChatOllama(model="phi3")
parser = StrOutputParser()

# Load embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# Set up Chroma vector store
persist_directory = './db_qsar_bdii'
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

# Check vectorstore collection count
print(vectorstore._collection.count())

prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are Ahmed el-Mansour Eddahbi, the historical Sultan of Morocco. 
    You answer questions about your life, achievements, and the history surrounding your reign, or about QSAR BDII in Marrakech. 
    If you don't know the answer, simply say 'I don't know'. 
    Keep your response concise, no longer than three sentences."""),
    
    MessagesPlaceholder("chat_history"),
    
    ("human", "{input}")
])


# Define system prompt for retrieval task
qa_system_prompt = """You are Ahmed el-Mansour Edahbi, answering the visitors who are passionate about your history. 
Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. 
Use three sentences maximum and keep the answer concise.

{context}"""
qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

# Contextualize the question with chat history
contextualize_q_system_prompt = """Given a chat history and the latest user question 
which might reference context in the chat history, formulate a standalone question 
which can be understood without the chat history. Do NOT answer the question, 
just reformulate it if needed and otherwise return it as is."""

contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

# Create history-aware retriever
history_aware_retriever = create_history_aware_retriever(llm, retriever, contextualize_q_prompt)

# Create retrieval chain
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

# Function to manage session-based chat history
store = {}
def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# Combine RAG chain with history management
conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer",
)

# LLM-based Query Classification
# @lru_cache(maxsize=100)
# LLM-based Query Classification for Ahmed el-Mansour Eddahbi and QSAR BDII
def classify_query(question: str, chat_history) -> bool:    
    # Format the chat history for context
    formatted_chat_history = format_chat_history(chat_history) if chat_history else "No previous conversation history."

    # Create the classification prompt
    classification_prompt = (
        f"You are an assistant specializing in the biography of Ahmed el-Mansour Eddahbi and QSAR BDII in Marrakech.\n"
        f"Please review the following conversation history and the current question to assess if document retrieval is required.\n\n"
        f"Conversation History:\n{formatted_chat_history}\n"
        f"Current Question: {question}\n\n"
        f"Based on the information provided, answer 'yes' if document retrieval is necessary to accurately answer the question, or 'no' if the LLM can directly answer it."
    )

    try:
        # Invoke the LLM to classify the query
        response = llm.invoke(classification_prompt)
        
        # Validate and process the response
        if response and "answer" in response:
            answer = response["answer"].strip().lower()
            return answer == 'yes'
        else:
            logging.error(f"Invalid or missing response from LLM: {response}")
            return False  # Default to no retrieval needed if response is invalid
        
    except Exception as e:
        logging.error(f"Error invoking LLM for classification: {e}")
        return False  # Default to no retrieval needed if an exception occurs

# Helper function to format chat history as a string
def format_chat_history(messages):
    formatted_history = ""
    for message in messages:
        if isinstance(message, HumanMessage):
            formatted_history += f"Human: {message.content}\n"
        elif isinstance(message, AIMessage):
            formatted_history += f"AI: {message.content}\n"
    return formatted_history
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from langdetect import detect

# Load NLLB model and tokenizer
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# List of supported language codes (add more if needed)
LANGUAGES = {
    "en": "eng_Latn",  # English
    "fr": "fra_Latn",  # French
    "es": "spa_Latn",  # Spanish
    "ar": "arb_Arab",  # Arabic
    # Add other languages as needed
}

# Function to translate text using the NLLB model
def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    # Check if the source language is supported
    if source_lang not in LANGUAGES or target_lang not in LANGUAGES:
        raise ValueError(f"Unsupported language: {source_lang} or {target_lang}")

    # Tokenize the input text
    inputs = tokenizer(text, return_tensors="pt")

    # Retrieve the language ID if `get_lang_id` method is available
    # Replace with correct method if different
    forced_bos_token_id = tokenizer.get_lang_id(LANGUAGES[target_lang]) if hasattr(tokenizer, 'get_lang_id') else None

    # Generate translation using the NLLB model
    with torch.no_grad():
        translated_tokens = model.generate(
            **inputs, 
            forced_bos_token_id=forced_bos_token_id
        )

    # Decode the translated tokens
    translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
    return translated_text

# Function to detect the language of a given text using langdetect
def detect_language(text: str) -> str:
    detected_lang = detect(text)
    if detected_lang not in LANGUAGES:
        return "en"  # Default to English if language is not supported
    return detected_lang

async def get_answer_and_docs(question: str, session_id: str) -> str:
    try:
        # Detect source language
        source_language = detect_language(question)

        # Translate the question to English if it's not in English
        if source_language != "en":
            question_en = translate_text(question, source_lang=source_language, target_lang="en")
        else:
            question_en = question

        # Retrieve session-specific chat history
        chat_history = get_session_history(session_id)

        # Classify if retrieval is necessary
        needs_retrieval = classify_query(question_en, chat_history.messages)

        if needs_retrieval:
            # Use conversational RAG chain with retrieval
            response = await conversational_rag_chain.invoke(
                {"input": question_en, "chat_history": chat_history.messages},
                config={"configurable": {"session_id": session_id}}
            )
        else:
            # Pass chat history as list of messages, not a formatted string
            chain_input = prompt_template.format(chat_history=chat_history.messages, input=question_en)

            # Invoke the LLM using the formatted prompt template
            response = llm.invoke(chain_input)

            # Check if the response is an AIMessage object
            if isinstance(response, AIMessage):
                # Update the chat history with the latest user question and LLM response
                chat_history.add_user_message(question)
                chat_history.add_ai_message(response.content.strip())

                # Translate the response back to the original language if needed
                if source_language != "en":
                    response_content = translate_text(response.content.strip(), source_lang="en", target_lang=source_language)
                else:
                    response_content = response.content.strip()

                return response_content
            else:
                return f"Unexpected response type: {type(response)}"

        # If retrieval was necessary
        if 'answer' in response:
            answer = response['answer']
            # Translate the answer back to the original language if needed
            if source_language != "en":
                answer_content = translate_text(answer.strip(), source_lang="en", target_lang=source_language)
            else:
                answer_content = answer.strip()
                
            return answer_content

    except Exception as e:
        return f"An error occurred while processing the question: {str(e)}"
