from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from functools import lru_cache
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

# Define system prompt for RAG task
system_prompt = (
    "You are Ahmed el-Mansour Edahbi ,answer the visitors who are passionate about your history. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, say that you don't know. "
    "Use three sentences maximum and keep the answer concise."
    "\n\n{context}"
)

# create RAG chain
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

question_answering_chain = llm | parser
rag_chain = retriever | question_answering_chain

# LLM-based Query Classification
@lru_cache(maxsize=100)
def classify_query(question: str) -> bool:
    classification_prompt = (
        f"Determine if the following question is related to Ahmed el-Mansour Edahbi, QSAR BDII, or Morocco. "
        f"Respond with a simple 'yes' if it is, or 'no' if it is not.\n\n"
        f"Question: {question}"
    )

    try:
        # Invoke the LLM to classify the query
        response = llm.invoke({"question": classification_prompt})

        # Validate that the response is well-formed and contains an answer
        if not response or "answer" not in response:
            logging.error(f"Invalid response from LLM: {response}")
            return False  # Return False as a fallback

        # Extract and normalize the answer (case-insensitive)
        answer = response["answer"].strip().lower()

        # Return True if the answer is "yes", otherwise False
        return 'yes' in answer

    except Exception as e:
        # Log any errors during LLM invocation
        logging.error(f"Error invoking LLM for classification: {e}")
        return False  # Fail-safe: Assume no retrieval is needed if an error occurs

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

# The main function for processing a question
async def get_answer_and_docs(question: str, session_id: str):
    try:
        # Classify if retrieval is necessary
        needs_retrieval = await classify_query(question)

        if needs_retrieval:
            
            # Use conversational RAG chain with retrieval
            response = await conversational_rag_chain.invoke(
                {"input": question},
                config={"configurable": {"session_id": session_id}}
            )
        else:
            # Rely on LLM's knowledge base directly if no retrieval is needed
            response = await conversational_rag_chain.invoke(
                {"input": question},
                config={"configurable": {"session_id": session_id}}
            )

        return response["answer"]

    except Exception as e:
        return f"An error occurred while processing the question: {str(e)}"
