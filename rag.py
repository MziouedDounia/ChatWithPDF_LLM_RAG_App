from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
# from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_community.vectorstores import Chroma
from langchain_chroma import Chroma
from operator import itemgetter
# import os
# from dotenv import load_dotenv

# load_dotenv()

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
#call the model with openAi
# local_model=""
#call the model with ChatOllama
local_model = "qwen2:1.5b"
#local_model = "phi3:3.8b-mini-4k-instruct-q3_K_S"
llm = ChatOllama(model=local_model)

#Parse the response
parser = StrOutputParser()

#Load data from pdf
loader = PyPDFLoader("./data/Artificial-Intelligence-The-Future.pdf")
pages = loader.load_and_split()
# page=pages[0]
# print(page.metadata)

# Split the document into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=7500, chunk_overlap=100)
chunks = text_splitter.split_documents(pages)

 # Instantiate embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

#vectorstoreInMemory
# vectorstore = DocArrayInMemorySearch.from_documents(pages, embedding=embeddings)
# retriever = vectorstore.as_retriever()
# retriever.invoke("machine learning")

# VectorstoreChroma
persist_directory = './db_chroma'
# vectorstore = Chroma.from_documents(
#     documents=chunks,
#     embedding=embeddings,
#     persist_directory=persist_directory
# )  
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

print(vectorstore._collection.count())

# Define the optimized RAG prompt template
template = """You are an AI assistant. Use the provided context to answer the question as it is in the context.

Context: {context}

Question: {question}

Answer:"""

prompt = PromptTemplate.from_template(template)


# Retrieve documents using similarity search
question = "What are the Advantages of AI"
docs = vectorstore.similarity_search(question, k=5)

# Format the context from retrieved documents
context = "\n".join([doc.page_content for doc in docs])




#adding the context to the prompt using chain
chain = (
    {
        "context": itemgetter("question") ,
        "question": itemgetter("question"),
    }
    | prompt
    | llm
    | parser
)

response = chain.invoke({'question': question})
print(response)