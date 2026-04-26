import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_ollama import ChatOllama

from tools.tools import (
    read_telegram_messages,
    send_telegram_message,
    send_whatsapp_message,
    fetch_emails_by_date,
    fetch_emails_from_sender,
    fetch_recent_emails,
    fetch_emails_on_date,
    fetch_today_emails,
    fetch_sender_emails_on_date,
    search_web
)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# All tools
# ---------------------------
tools = [
    read_telegram_messages,
    send_telegram_message,
    send_whatsapp_message,
    fetch_emails_by_date,
    fetch_emails_from_sender,
    fetch_recent_emails,
    fetch_emails_on_date,
    fetch_today_emails,
    fetch_sender_emails_on_date,
    search_web
]

# ---------------------------
# Initialize model
# ---------------------------
llm = ChatOllama(
    model="llama3.2"
)

# Bind tools
llm_with_tools = llm.bind_tools(tools)


# ---------------------------
# Request schema
# ---------------------------
class ChatRequest(BaseModel):
    query: str


# ---------------------------
# Chat API
# ---------------------------
@app.get("/")
async def root():
    return {"status": "ok", "message": "Multi-Platform Agent Backend is running"}


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        query = request.query

        # LLM decides tool
        response = llm_with_tools.invoke(query)

        if response.tool_calls:
            tool_call = response.tool_calls[0]

            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            print(f"Executing tool: {tool_name}")
            print(f"Arguments: {tool_args}")

            # Find matching tool
            selected_tool = next(
                (tool for tool in tools if tool.name == tool_name),
                None
            )

            if selected_tool:
                result = await selected_tool.ainvoke(tool_args)

                return {
                    "status": "success",
                    "tool_used": tool_name,
                    "tool_args": tool_args,
                    "result": result
                }

            else:
                return {
                    "status": "error",
                    "message": "Tool not found"
                }

        else:
            return {
                "status": "success",
                "message": response.content
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }