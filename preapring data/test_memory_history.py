from dotenv import load_dotenv
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_chroma import Chroma
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_text_splitters import RecursiveCharacterTextSplitter

import os

# Charger les variables depuis le fichier .env
load_dotenv()

# Définir les variables d'environnement
os.environ["LANGCHAIN_TRACING_V2"] = "true"  # Tu peux aussi ajouter cette variable dans ton fichier .env si tu veux
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"

# Récupérer la clé API depuis .env
os.environ["LANGCHAIN_API_KEY"] = "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"


from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain.memory import ConversationBufferMemory

# memory = ConversationBufferMemory()
# memory = ConversationBufferMemory(return_messages=True)
# memory = ConversationBufferMemory(memory_key="chat_history")


llm = ChatOllama(model="phi3")
parser = StrOutputParser()
persist_directory = './db_qsar_bdii'
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
retriever = vectorstore.as_retriever()

### Contextualize question ###
contextualize_q_system_prompt = """Given a chat history and the latest user question \
which might reference context in the chat history, formulate a standalone question \
which can be understood without the chat history. Do NOT answer the question, \
just reformulate it if needed and otherwise return it as is."""
contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)
history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)

### Answer question ###
qa_system_prompt = """You are Ahmed al-Mansour, also known as Moulay ad-Dhahbî an assistant for question-answering tasks. \
Use the following pieces of retrieved context to answer the question. \
If you don't know the answer, just say that you don't know. \
Use three sentences maximum and keep the answer concise.\

{context}"""
qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)
question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)


### Statefully manage chat history ###
store = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer",
)