# from langchain_community.chat_models import ChatOllama
# from langchain_core.output_parsers import StrOutputParser
# from langchain_community.document_loaders import PyPDFLoader
# from langchain.prompts import PromptTemplate
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.embeddings import OllamaEmbeddings
# from langchain_community.vectorstores import DocArrayInMemorySearch
# from operator import itemgetter
# # import os
# # from dotenv import load_dotenv

# # load_dotenv()

# # OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# #call the model with openAi
# # local_model=""
# #call the model with ChatOllama
# local_model = "phi3"
# #local_model = "phi3:3.8b-mini-4k-instruct-q3_K_S"
# llm = ChatOllama(model=local_model)

# #Parse the response
# parser = StrOutputParser()

# #Load data from pdf
# loader = PyPDFLoader("./data/Artificial-Intelligence-The-Future.pdf")
# pages = loader.load_and_split()
# # page=pages[0]
# # print(page.metadata)

# # Split the document into chunks
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=7500, chunk_overlap=100)
# chunks = text_splitter.split_documents(pages)

#  # Instantiate embedding model
# embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# #vectorstoreInMemory
# vectorstore = DocArrayInMemorySearch.from_documents(pages, embedding=embeddings)
# retriever = vectorstore.as_retriever()
# retriever.invoke("machine learning")

# # Define the RAG prompt template
# template = """You are a helpful assistant that answers questions based on the given context.

#     Context: {context}

#     Question: {question}

#     Answer:"""

# prompt = PromptTemplate.from_template(template)
# # prompt.format(context="Here is some context",question="here is a question")


# #Exemple:
# # chain=prompt|llm|parser
# # response = chain.invoke({"context": "My parents named me Santiago", "question": "What's your name'?"})

# #adding the context to the prompt using chain
# chain = (
#     {
#         "context": itemgetter("question") | retriever,
#         "question": itemgetter("question"),
#     }
#     | prompt
#     | llm
#     | parser
# )
# # response=chain.invoke({'question': "What are the types of Artificial Intelligence"})
# # response=chain.invoke({'question': "What are the three categories of intelligence level"})
# response=chain.invoke({'question': "What are the Advantages of AI"})
# print(response)