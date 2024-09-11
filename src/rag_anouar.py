from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_chroma import Chroma
from langchain.memory import ConversationBufferMemory

from operator import itemgetter
from dotenv import load_dotenv
import os

# Charger les variables depuis le fichier .env
load_dotenv()

# Définir les variables d'environnement
os.environ["LANGCHAIN_TRACING_V2"] = "true"  # Tu peux aussi ajouter cette variable dans ton fichier .env si tu veux
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
# Optionnel: Vérifier si la clé API est bien chargée
if os.environ["LANGCHAIN_API_KEY"] is None:
    raise ValueError("LANGCHAIN_API_KEY is not set. Please check your .env file.")


#call the model with ChatOllama
# local_model = "qwen2:1.5b"
local_model = "phi3"

llm = ChatOllama(model=local_model)

#Parse the response
parser = StrOutputParser()

 # Instantiate embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# VectorstoreChroma
persist_directory = './db_qsar_bdii'

vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

print(vectorstore._collection.count())
retriever=vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
from langchain_core.prompts import ChatPromptTemplate
prompt = ChatPromptTemplate.from_messages(
    [
        ("placeholder", "{chat_history}"),
        ("user", "{input}"),
        (
            "user",
            "Given the above conversation, generate a search query to look up to get information relevant to the conversation",
        ),
    ]
)
from langchain.chains import create_history_aware_retriever, create_retrieval_chain

retriever_chain = create_history_aware_retriever(llm, retriever, prompt)


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the user's questions based on the below context:\n\n{context}",
        ),
        ("placeholder", "{chat_history}"),
        ("user", "{input}"),
    ]
)
from langchain.chains.combine_documents import create_stuff_documents_chain

document_chain = create_stuff_documents_chain(llm, prompt)

qa = create_retrieval_chain(retriever_chain, document_chain)


def get_answer_and_docs(question:str):
    
    # docs = vectorstore.similarity_search(question, k=5)
    # context = "\n".join([doc.page_content for doc in docs])
    # chain_input = {
    #     "context": context,
    #     "question": question,
    # }
    # chain = prompt | llm | parser
    # response = chain.invoke(chain_input)
    response=qa.invoke({"input": question})
    return response
