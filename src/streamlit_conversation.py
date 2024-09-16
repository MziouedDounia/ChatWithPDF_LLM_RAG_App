from langchain.chains import retrieval_qa
from langchain_community.embeddings import OllamaEmbeddings
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser

from rag import get_answer_and_docs


#stream lit interface
import streamlit as st
#bring waxton interface
# from watsonxlangchain import langchaininterface

st.title('Ask el mansour eddahbi')
if 'messages' not in st.session_state:
    st.session_state.messages=[]

for message in st.session_state.messages:
    st.chat_message(message['role']).markdown(message['content'])

#input template display 
prompt=st.chat_input('pass your prompt here')

if (prompt):
    st.chat_message('user').markdown(prompt)
    st.session_state.messages.append({'role':'user','content':prompt})
    response=get_answer_and_docs(prompt)
    # st.session_state.messages.append({'role': 'assistant', 'content': response})
    response_text = str(response)
    
    # Affiche la réponse de l'assistant dans le chat
    st.chat_message('assistant').markdown(response_text)
    
    # Ajout de la réponse de l'assistant dans la session
    st.session_state.messages.append({'role': 'assistant', 'content': response_text})
