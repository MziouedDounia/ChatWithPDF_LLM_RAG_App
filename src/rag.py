from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
# from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_community.vectorstores import Chroma

from langchain.memory import ConversationBufferMemory

from operator import itemgetter
from dotenv import load_dotenv
import os

# Charger les variables depuis le fichier .env
load_dotenv()

# Définir les variables d'environnement
os.environ["LANGCHAIN_TRACING_V2"] = "true"  # Tu peux aussi ajouter cette variable dans ton fichier .env si tu veux
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"

# Récupérer la clé API depuis .env
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

#Load data from pdf
#loader = PyPDFLoader("./data/Artificial-Intelligence-The-Future.pdf")
#pages = loader.load_and_split()
# page=pages[0]
# print(page.metadata)

# Split the document into chunks
#text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
#chunks = text_splitter.split_documents(pages)

 # Instantiate embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

#vectorstoreInMemory
# vectorstore = DocArrayInMemorySearch.from_documents(pages, embedding=embeddings)
# retriever = vectorstore.as_retriever()
# retriever.invoke("machine learning")

# VectorstoreChroma
persist_directory = './db_qsar_bdii'
# vectorstore = Chroma.from_documents(
#     documents=chunks,
#     embedding=embeddings,
#     persist_directory=persist_directory
# )  
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

print(vectorstore._collection.count())

# Define the optimized RAG prompt template
template = """You are a helpful assistant that answers questions based only on the given context.
If you don't know the answer, just say that you don't know, don't try to make up an answer. 
Use three sentences maximum.

Context: {context}

Question: {question}

Answer: """

prompt = PromptTemplate.from_template(template)

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)
qa = ConversationalRetrievalChain.from_llm(
    llm,
    retriever=vectorstore.as_retriever(),
    memory=memory
)


# while True:
#     # Retrieve documents using similarity search
#     question = input("Please type your question (or type 'exit' to quit): ")
#     if question.lower() == 'exit':
#         break

#     docs = vectorstore.similarity_search(question, k=5)

#     # Format the context from retrieved documents
#     context = "\n".join([doc.page_content for doc in docs])


# #adding the context to the prompt using chain
# chain = (
#     {
#         "context": itemgetter("context")  ,
#         "question": itemgetter("question"),
#     }
#     | prompt
#     | llm
#     | parser
# )

# response = chain.invoke({'question': question})

# Add the context to the prompt and invoke the chain


# Build the chain with the context and question

def get_answer_and_docs(question:str):
    
    docs = vectorstore.similarity_search(question, k=5)
    context = "\n".join([doc.page_content for doc in docs])
    chain_input = {
        "context": context,
        "question": question,
    }
    chain = prompt | llm | parser
    response = chain.invoke(chain_input)

    return response
