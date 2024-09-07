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
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = text_splitter.split_documents(pages)

 # Instantiate embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

#vectorstoreInMemory
# vectorstore = DocArrayInMemorySearch.from_documents(pages, embedding=embeddings)
# retriever = vectorstore.as_retriever()
# retriever.invoke("machine learning")

# VectorstoreChroma
persist_directory = './db_chroma2'
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
Use six sentences maximum.

Context: {context}

Question: {question}

Answer: """

prompt = PromptTemplate.from_template(template)


# Retrieve documents using similarity search
question = input("Please type your question: ")
docs = vectorstore.similarity_search(question, k=5)

# Format the context from retrieved documents
context = "\n".join([doc.page_content for doc in docs])

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
chain_input = {
    "context": context,
    "question": question,
}

# Build the chain with the context and question
chain = prompt | llm | parser

answer = chain.invoke(chain_input)
print("Answer:", answer)