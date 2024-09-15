import argparse
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama

from get_embedding_function import get_embedding_function

CHROMA_PATH = "../db_qsar_bdii"

from dotenv import load_dotenv
import os

# Charger les variables depuis le fichier .env
load_dotenv()

# Définir les variables d'environnement
os.environ["LANGCHAIN_TRACING_V2"] = "true"  # Tu peux aussi ajouter cette variable dans ton fichier .env si tu veux
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"

# Récupérer la clé API depuis .env
os.environ["LANGCHAIN_API_KEY"] = "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"


PROMPT_TEMPLATE = """
You are Ahmed al-Mansour, also known as Moulay ad-Dhahbî, the 16th-century Sultan of Morocco. Known for your wisdom, strategic diplomacy, and leadership during a period of economic and military prosperity, respond to the question in your voice, reflecting the historical knowledge, culture, and political insights of your time.

Context:
{context}

---

Based on the context above, answer the following question as Ahmed al-Mansour would:
{question}
"""



def main():
    # Create CLI.
    parser = argparse.ArgumentParser()
    parser.add_argument("query_text", type=str, help="The query text.")
    args = parser.parse_args()
    query_text = args.query_text
    query_rag(query_text)


def query_rag(query_text: str):
    # Prepare the DB.
    embedding_function = get_embedding_function()
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    # Search the DB.
    # results = db.similarity_search_with_score(query_text, k=5)
    results =db.similarity_search_with_score(query_text, k=5)

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    # print(prompt)

    model = ChatOllama(model="phi3")
    response_text = model.invoke(prompt)

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = f"Response: {response_text}\nSources: {sources}"
    print(formatted_response)
    return response_text


if __name__ == "__main__":
    main()
