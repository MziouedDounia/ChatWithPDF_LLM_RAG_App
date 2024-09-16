import asyncio
from typing import List
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from dotenv import load_dotenv
from langchain_core.messages import  AIMessage , HumanMessage
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from langdetect import detect as langdetect_detect
from langdetect.lang_detect_exception import LangDetectException
import torch
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import logging
import os

# Load environment variables from .env file
load_dotenv()

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus/"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_PROJECT"] = "rag qsar bdii"

# Ensure API key is set
if os.environ["LANGCHAIN_API_KEY"] is None:
    raise ValueError("LANGCHAIN_API_KEY is not set. Please check your .env file.")

# Initialize the LLM with ChatOllama
local_model = os.getenv("MODEL_NAME") 
llm = ChatOllama(model=local_model)
parser = StrOutputParser()

# Load embedding model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# Set up Chroma vector store
persist_directory = './db_qsar_bdii'
vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

# Check vectorstore collection count
print(vectorstore._collection.count())

prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are Ahmed el-Mansour Eddahbi, the historical Sultan of Morocco. 
    You answer questions about your life, achievements, and the history surrounding your reign, or about QSAR BDII in Marrakech. 
    If you don't know the answer, simply say 'I don't know'. 
    Keep your response concise, no longer than three sentences."""),
    
    MessagesPlaceholder("chat_history"),
    
    ("human", "{input}")
])


# Define system prompt for retrieval task
qa_system_prompt = """You are Ahmed el-Mansour Edahbi, answering the visitors who are passionate about your history. 
Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know. 
Use three sentences maximum and keep the answer concise.

{context}"""
qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

# Contextualize the question with chat history
contextualize_q_system_prompt = """Given a chat history and the latest user question 
which might reference context in the chat history, formulate a standalone question 
which can be understood without the chat history. Do NOT answer the question, 
just reformulate it if needed and otherwise return it as is."""

contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

# Create history-aware retriever
history_aware_retriever = create_history_aware_retriever(llm, retriever, contextualize_q_prompt)

# Create retrieval chain
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

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


model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)


# Mapping des codes de langue langdetect vers les codes NLLB
LANGDETECT_TO_NLLB = {
    'af': 'afr_Latn',  # Afrikaans
    'ar': 'arb_Arab',  # Arabic
    'bg': 'bul_Cyrl',  # Bulgarian
    'bn': 'ben_Beng',  # Bengali
    'ca': 'cat_Latn',  # Catalan
    'cs': 'ces_Latn',  # Czech
    'cy': 'cym_Latn',  # Welsh
    'da': 'dan_Latn',  # Danish
    'de': 'deu_Latn',  # German
    'el': 'ell_Grek',  # Greek
    'en': 'eng_Latn',  # English
    'es': 'spa_Latn',  # Spanish
    'et': 'est_Latn',  # Estonian
    'fa': 'pes_Arab',  # Persian
    'fi': 'fin_Latn',  # Finnish
    'fr': 'fra_Latn',  # French
    'gu': 'guj_Gujr',  # Gujarati
    'he': 'heb_Hebr',  # Hebrew
    'hi': 'hin_Deva',  # Hindi
    'hr': 'hrv_Latn',  # Croatian
    'hu': 'hun_Latn',  # Hungarian
    'id': 'ind_Latn',  # Indonesian
    'it': 'ita_Latn',  # Italian
    'ja': 'jpn_Jpan',  # Japanese
    'kn': 'kan_Knda',  # Kannada
    'ko': 'kor_Hang',  # Korean
    'lt': 'lit_Latn',  # Lithuanian
    'lv': 'lvs_Latn',  # Latvian
    'mk': 'mkd_Cyrl',  # Macedonian
    'ml': 'mal_Mlym',  # Malayalam
    'mr': 'mar_Deva',  # Marathi
    'ne': 'npi_Deva',  # Nepali
    'nl': 'nld_Latn',  # Dutch
    'no': 'nob_Latn',  # Norwegian (Bokmål)
    'pa': 'pan_Guru',  # Punjabi
    'pl': 'pol_Latn',  # Polish
    'pt': 'por_Latn',  # Portuguese
    'ro': 'ron_Latn',  # Romanian
    'ru': 'rus_Cyrl',  # Russian
    'sk': 'slk_Latn',  # Slovak
    'sl': 'slv_Latn',  # Slovenian
    'so': 'som_Latn',  # Somali
    'sq': 'als_Latn',  # Albanian
    'sv': 'swe_Latn',  # Swedish
    'sw': 'swh_Latn',  # Swahili
    'ta': 'tam_Taml',  # Tamil
    'te': 'tel_Telu',  # Telugu
    'th': 'tha_Thai',  # Thai
    'tl': 'tgl_Latn',  # Tagalog
    'tr': 'tur_Latn',  # Turkish
    'uk': 'ukr_Cyrl',  # Ukrainian
    'ur': 'urd_Arab',  # Urdu
    'vi': 'vie_Latn',  # Vietnamese
    'zh-cn': 'zho_Hans',  # Chinese (Simplified)
    'zh-tw': 'zho_Hant',  # Chinese (Traditional)
}

def get_lang_id(lang_code):
    return tokenizer.convert_tokens_to_ids(lang_code)

def detect_language(text: str) -> str:
    if not text.strip():
        logger.warning("Empty text provided. Defaulting to English.")
        return "eng_Latn"
    
    try:
        detected_lang = langdetect_detect(text)
        nllb_lang = LANGDETECT_TO_NLLB.get(detected_lang, "eng_Latn")
        logger.info(f"Detected language: {detected_lang} (NLLB: {nllb_lang})")
        return nllb_lang
    except LangDetectException as e:
        logger.warning(f"Language detection failed: {str(e)}. Defaulting to English.")
        return "eng_Latn"

async def verify_translation(original_text: str, translated_text: str, source_lang: str, target_lang: str) -> bool:
    prompt = f"""Please verify if the following translation is correct:

Original text ({source_lang}): "{original_text}"
Translated text ({target_lang}): "{translated_text}"

Is this translation accurate and conveys the same meaning? Answer with 'Yes' if it's correct, or 'No' if it's incorrect."""

    try:
        response = await llm.ainvoke(prompt)
        answer = response.content if isinstance(response, AIMessage) else str(response)
        return answer.strip().lower() == 'yes'
    except Exception as e:
        logger.error(f"Translation verification failed: {str(e)}")
        return False

async def translate_with_llm(text: str, target_lang: str) -> str:
    prompt = f"Translate the following text to {target_lang}: \"{text}\""
    
    try:
        response = await llm.ainvoke(prompt)
        translation = response.content if isinstance(response, AIMessage) else str(response)
        return translation.strip()
    except Exception as e:
        logger.error(f"LLM translation failed: {str(e)}")
        return f"LLM translation failed: {str(e)}"

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    logger.info(f"Translating from {source_lang} to {target_lang}")
    logger.debug(f"Input text: {text}")

    inputs = tokenizer(text, return_tensors="pt").to(device)
    
    tgt_lang_id = get_lang_id(target_lang)

    logger.debug(f"Target language ID: {tgt_lang_id}")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=tgt_lang_id,
            max_length=128,
            num_beams=4,
            early_stopping=True
        )

    translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    translated_text = translated_text.strip()
    
    logger.info(f"Translation completed")
    logger.debug(f"Translated text: {translated_text}")
    
    return translated_text

async def translate_with_timeout(text: str, target_lang: str, timeout: float = 15.0) -> str:
    try:
        # Detect language using langdetect
        source_lang = detect_language(text)
        
        # Use NLLB for translation
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, translate_text, text, source_lang, target_lang),
            timeout=timeout
        )
        
        # Verify the translation
        is_translation_correct = await verify_translation(text, result, source_lang, target_lang)
        
        if not is_translation_correct:
            logger.info("Translation verification failed. Using LLM for retranslation.")
            result = await translate_with_llm(text, target_lang)
        
        return result
    except asyncio.TimeoutError:
        logger.error(f"Operation timed out after {timeout} seconds.")
        return f"Operation timed out after {timeout} seconds."
    except Exception as e:
        logger.error(f"Operation failed: {str(e)}")
        return f"Operation failed: {str(e)}"

# LLM-based Query Classification for Ahmed el-Mansour Eddahbi and QSAR BDII
def classify_query(question: str, chat_history) -> bool:    

    # Format the chat history for context
    formatted_chat_history = format_chat_history(chat_history) if chat_history else "No previous conversation history."

    # Create the classification prompt
    classification_prompt = (
    f"You are an assistant specializing in the biography of Ahmed el-Mansour Eddahbi and QSAR BDII in Marrakech.\n"
    f"Please review the following conversation history and current question to determine if document retrieval (RAG) is necessary to answer the question accurately.\n\n"
    f"Conversation History:\n{formatted_chat_history}\n"
    f"Current Question: {question}\n\n"
    f"Based on the information provided, answer 'yes' if document retrieval is required to answer the question, or 'no' if the LLM can directly answer it. Consider whether the question is factual, requires specific knowledge about Ahmed el-Mansour Eddahbi or QSAR BDII, or involves complex reasoning.\n"
    )

    try:
        # Invoke the LLM to classify the query
        response = llm.invoke(classification_prompt)
        
        # Validate and process the response
        if isinstance(response, dict) and "answer" in response:
            answer = response["answer"].strip().lower()
            logging.info(f"Classification response: {answer}")
            if answer.startswith("yes"):
                return True
            elif answer.startswith("no"):
                return False
            else:
                logging.warning(f"Unexpected classification response: {answer}. Defaulting to retrieval.")
                return True
        else:
            logging.error(f"Invalid or missing response from LLM: {response}")
            return True  # Default to retrieval if response is invalid
        
    except Exception as e:
        logging.error(f"Error invoking LLM for classification: {e}")
        return True 

# Helper function to format chat history as a string
def format_chat_history(messages: List[HumanMessage | AIMessage]) -> str:
    formatted_history = ""
    for message in messages:
        if isinstance(message, HumanMessage):
            formatted_history += f"Human: {message.content}\n"
        elif isinstance(message, AIMessage):
            formatted_history += f"AI: {message.content}\n"
    return formatted_history.strip()

async def get_answer_and_docs(question: str, session_id: str) -> str:
    try:
        source_language = detect_language(question)
        logger.info(f"Detected language: {source_language}")

        if source_language != "eng_Latn":
            logger.info(f"Translating question from {source_language} to English")
            question_en = await translate_with_timeout(question, target_lang="eng_Latn")
            if question_en.startswith("Operation timed out") or question_en.startswith("Operation failed"):
                return "I'm sorry, but the translation process encountered an issue. Please try again or use English if possible."
            logger.info(f"Translated question: {question_en}")
        else:
            question_en = question

        chat_history = get_session_history(session_id)

        # Use a timeout for the classification and QA operations
        try:
            needs_retrieval = await asyncio.wait_for(
                asyncio.to_thread(classify_query, question_en, chat_history.messages),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            logger.warning("Query classification timed out. Defaulting to retrieval.")
            needs_retrieval = True

        try:
            if needs_retrieval:
                logging.info("Performing RAG retrieval")
                response = await asyncio.wait_for(
                    conversational_rag_chain.ainvoke(
                        {"input": question_en},
                        config={"configurable": {"session_id": session_id}}
                    ),
                    timeout=30.0
                )
                answer = response.get('answer', "I'm sorry, I couldn't find an answer.")
                logging.info(f"RAG answer: {answer}")
            else:
                logging.info("Using direct LLM response")
                chain_input = prompt_template.format(chat_history=chat_history.messages, input=question_en)
                response = await asyncio.wait_for(llm.ainvoke(chain_input), timeout=10.0)
                answer = response.content if isinstance(response, AIMessage) else str(response)
                logging.info(f"LLM answer: {answer}")

            chat_history.add_user_message(question_en)
            chat_history.add_ai_message(answer)

            if source_language != "eng_Latn":
                logging.info(f"Translating answer from English to {source_language}")
                answer_content = await translate_with_timeout(answer.strip(), target_lang=source_language)
                if answer_content.startswith("Operation timed out") or answer_content.startswith("Operation failed"):
                    return "I have an answer, but the translation back to your language encountered an issue. Would you like the answer in English instead?"
            else:
                answer_content = answer.strip()

            logging.info(f"Final answer: {answer_content}")
            return answer_content

        except asyncio.TimeoutError:
            return "I'm sorry, but the operation took too long to complete. Please try again or rephrase your question."

    except Exception as e:
        logging.error(f"Error in get_answer_and_docs: {str(e)}", exc_info=True)
        return f"An error occurred while processing the question: {str(e)}"