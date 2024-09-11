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
    ("system", "You are a helpful assistant."),
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
# LLM-based Query Classification
def classify_query(question: str, chat_history) -> bool:
   
    # Format the chat history as a readable string for the LLM
    formatted_chat_history = format_chat_history(chat_history)

    # Construct the classification prompt with clear instructions
    classification_prompt = (
        f"Based on the following conversation history and the current question, "
        f"determine if the question requires document retrieval or can be answered using the existing conversation context.\n\n"
        f"Conversation History:\n{formatted_chat_history}\n"
        f"Current Question: {question}\n\n"
        f"Answer 'yes' if document retrieval is necessary to answer the question, or 'no' if the LLM can handle it directly using the conversation history."
    )

    try:
        # Invoke the LLM to classify the query with the conversation history
        response = llm.invoke(classification_prompt)

        # Validate that the response is well-formed and contains an answer
        if not response or "answer" not in response:
            logging.error(f"Invalid response from LLM: {response}")
            return False  # Return False as a fallback

        # Extract and normalize the answer (case-insensitive)
        answer = response["answer"].strip().lower()

        # Return True if the answer is "yes" (retrieval needed), otherwise False
        return 'yes' in answer

    except Exception as e:
        logging.error(f"Error invoking LLM for classification: {e}")
        return False  # Fail-safe: Assume no retrieval is needed if an error occurs

# Helper function to format chat history as a string
def format_chat_history(messages):
    formatted_history = ""
    for message in messages:
        if isinstance(message, HumanMessage):
            formatted_history += f"Human: {message.content}\n"
        elif isinstance(message, AIMessage):
            formatted_history += f"AI: {message.content}\n"
    return formatted_history

# The main function for processing a question
async def get_answer_and_docs(question: str, session_id: str):
    try:
        # Retrieve session-specific chat history
        chat_history = get_session_history(session_id)

        # Classify if retrieval is necessary (no need to await classify_query)
        needs_retrieval = classify_query(question, chat_history.messages)

        if needs_retrieval:
            # Use conversational RAG chain with retrieval
            response = await conversational_rag_chain.invoke(
                {"input": question, "chat_history": chat_history.messages},
                config={"configurable": {"session_id": session_id}}
            )
        else:
            # Pass chat history as list of messages, not a formatted string
            chain_input = prompt_template.format(chat_history=chat_history.messages, input=question)

            # Invoke the LLM using the formatted prompt template
            response = await llm.invoke(chain_input)

            # Check if the response is an AIMessage object
            if isinstance(response, AIMessage):
                # Update the chat history with the latest user question and LLM response
                chat_history.add_user_message(question)
                chat_history.add_ai_message(response.content.strip())
                return response.content.strip()
            else:
                return f"Unexpected response type: {type(response)}"

        return response["answer"]

    except Exception as e:
        return f"An error occurred while processing the question: {str(e)}"