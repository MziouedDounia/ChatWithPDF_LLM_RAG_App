from langchain_community.chat_models import ChatOllama

local_model = "qwen2:1.5b"
llm = ChatOllama(model=local_model)

response = llm.invoke("what is the meaning of life?")
print(response)