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
from async_lru import alru_cache
from langchain_core.messages import HumanMessage, AIMessage
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

# LLM-based Query Classification with async lru cache
@alru_cache(maxsize=100)  # Async LRU cache
async def classify_query(question: str) -> bool:
    classification_prompt = (
        f"Determine if the following question is related to Ahmed el-Mansour Edahbi, QSAR BDII, or Morocco. "
        f"Respond with a simple 'yes' if it is, or 'no' if it is not.\n\n"
        f"Question: {question}"
    )

    try:
        # Invoke the LLM asynchronously
        response = await llm.invoke(classification_prompt)

        # Check if the response is an AIMessage object and extract the content
        if isinstance(response, AIMessage):
            answer = response.content.strip().lower()
        else:
            logging.error(f"Unexpected response type: {type(response)}")
            return False

        print("LLM response:", answer)

        # Simplified logic to look for 'yes' or 'no' in the response text
        if "yes" in answer:
            return True
        elif "no" in answer:
            return False
        else:
            logging.error(f"Unable to classify the response: {answer}")
            return False

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
            chat_history = get_session_history(session_id)
            # Rely on LLM's knowledge base directly if no retrieval is needed
            response = await llm.invoke({
                "input": question,
                "chat_history": chat_history.messages  # Pass the conversation history here
            })
            
            # Check if the response is an AIMessage object and update history
            if isinstance(response, AIMessage):
                # Update the chat history with the latest user question and LLM response
                chat_history.add_user_message(question)
                chat_history.add_ai_message(response.content.strip())
                return response.content.strip()
            else:
                return f"Unexpected response type: {type(response)}"

        # Assuming the response is a dictionary and contains the answer
        return response["answer"]

    except Exception as e:
        return f"An error occurred while processing the question: {str(e)}"
