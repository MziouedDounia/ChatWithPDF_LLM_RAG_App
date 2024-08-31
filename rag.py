from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
local_model = "qwen2:1.5b"
#local_model = "phi3:3.8b-mini-4k-instruct-q3_K_S"
llm = ChatOllama(model=local_model)

# response = llm.invoke("what is the meaning of life?")
# print(response)
parser = StrOutputParser()
chain = llm | parser
Answer = chain.invoke("what is the capital of france ")
print("Answer: ", Answer)