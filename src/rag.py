import asyncio
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
local_model = "qwen2:1.5b"
# local_model="phi3"
llm = ChatOllama(model=local_model)
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
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

LANGUAGES = {
    "en": "eng_Latn",
    "fr": "fra_Latn",
    "es": "spa_Latn",
    "ar": "arb_Arab",
    # Add other languages as needed
}

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    if source_lang not in LANGUAGES or target_lang not in LANGUAGES:
        raise ValueError(f"Unsupported language: {source_lang} or {target_lang}")

    logger.debug(f"Translating from {source_lang} to {target_lang}")
    logger.debug(f"Input text: {text}")

    # Tokenize the input text
    inputs = tokenizer(text, return_tensors="pt").to(device)
    
    # Get the language codes
    src_lang_code = tokenizer.convert_tokens_to_ids(LANGUAGES[source_lang])#a suuprimer apres
    tgt_lang_code = tokenizer.convert_tokens_to_ids(LANGUAGES[target_lang])

    
    logger.debug(f"Source language code: {src_lang_code}")
    logger.debug(f"Target language ID: {tgt_lang_code}")

    # Force the model to use the correct source and target languages
    forced_bos_token_id = tgt_lang_code
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=128,
            num_beams=4,
            early_stopping=True
        )

    translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
    translated_text = translated_text.strip()
    
    logger.debug(f"Translated text: {translated_text}")
    
    return translated_text


async def translate_with_timeout(text: str, source_lang: str, target_lang: str, timeout: float = 10.0) -> str:
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, translate_text, text, source_lang, target_lang),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        logger.error(f"Translation timed out after {timeout} seconds.")
        return f"Translation timed out after {timeout} seconds."

def detect_language(text: str) -> str:
    try:
        detected_lang = detect(text)
        return detected_lang if detected_lang in LANGUAGES else "en"
    except:
        return "en"

async def get_answer_and_docs(question: str, session_id: str) -> str:
    try:
        source_language = await asyncio.to_thread(detect_language,question)
        logger.info(f"Detected language: {source_language}")

        if source_language != "en":
            logger.info(f"Translating question from {source_language} to English")
            question_en = await translate_with_timeout(question, source_lang=source_language, target_lang="en")
            if question_en.startswith("Translation timed out"):
                return "I'm sorry, but the translation process took too long. Please try again or use English if possible."
            logger.info(f"Translated question: {question_en}")
        else:
            question_en = question

        chat_history = get_session_history(session_id)

        # Use a timeout for the classification and QA operations
        try:
            needs_retrieval = await asyncio.wait_for(
                asyncio.to_thread(classify_query, question_en, chat_history.messages),
                timeout=10.0
        )
        except asyncio.TimeoutError:
            logger.warning("Query classification timed out. Defaulting to no retrieval.")
            needs_retrieval = False

        try:
            if needs_retrieval:
                response = await asyncio.wait_for(
                    conversational_rag_chain.ainvoke(
                        {"input": question_en, "chat_history": chat_history.messages},
                        config={"configurable": {"session_id": session_id}}
                    ),
                    timeout=10.0
                )
                answer = response.get('answer', "I'm sorry, I couldn't find an answer.")
            else:
                chain_input = prompt_template.format(chat_history=chat_history.messages, input=question_en)
                response = await asyncio.wait_for(llm.ainvoke(chain_input), timeout=10.0)
                answer = response.content if isinstance(response, AIMessage) else str(response)

            chat_history.add_user_message(question)
            chat_history.add_ai_message(answer)

            if source_language != "en":
                answer_content = await translate_with_timeout(answer.strip(), source_lang="en", target_lang=source_language)
                if answer_content.startswith("Translation timed out"):
                    return "I have an answer, but the translation back to your language timed out. Would you like the answer in English instead?"
            else:
                answer_content = answer.strip()

            print(f"Final answer: {answer_content}")  # Debug print
            return answer_content

        except asyncio.TimeoutError:
            return "I'm sorry, but the operation took too long to complete. Please try again or rephrase your question."

    except Exception as e:
        logger.error(f"Error in get_answer_and_docs: {str(e)}", exc_info=True)
        return f"An error occurred while processing the question: {str(e)}"
    
#end