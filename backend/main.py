import asyncio
import logging
from typing import Annotated, TypedDict, List, Union, Dict, Any

from fastapi import FastAPI
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from fastapi.middleware.cors import CORSMiddleware

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
    send_email,
    web_search
)

# ---------------------------
# Setup Logging
# ---------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("multi-agent-backend")

app = FastAPI(title="Multi-Platform Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Define Tools
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
    send_email,
    web_search
]

# ---------------------------
# Initialize model
# ---------------------------
llm = ChatOllama(model="llama3.2")
llm_with_tools = llm.bind_tools(tools)

# ---------------------------
# LangGraph Setup
# ---------------------------
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]

# Node 1: The Model/Agent
async def call_model(state: AgentState):
    logger.info("Calling model node")
    response = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [response]}

# Node 2: The Tools
tool_node = ToolNode(tools)

# Define Logic for Transitions
def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

# Compile
agent_app = workflow.compile()

# ---------------------------
# Request schema
# ---------------------------
class ChatRequest(BaseModel):
    query: str

# ---------------------------
# Helpers
# ---------------------------
def format_email_results(result: Any, tool_name: str) -> str:
    email_tools = [
        "fetch_emails_by_date",
        "fetch_emails_from_sender",
        "fetch_recent_emails",
        "fetch_emails_on_date",
        "fetch_today_emails",
        "fetch_sender_emails_on_date"
    ]
    if tool_name in email_tools:
        if isinstance(result, list) and len(result) > 0:
            formatted_emails = []
            for email_data in result:
                content = email_data.get("content", "No content").strip()
                email_str = (
                    f"### 📧 {email_data.get('subject', 'No Subject')}\n"
                    f"**From:** {email_data.get('from', 'Unknown')}\n"
                    f"**Date:** {email_data.get('date', 'Unknown')}\n\n"
                    f"{content}\n"
                    f"\n---\n"
                )
                formatted_emails.append(email_str)
            return "\n".join(formatted_emails)
        elif isinstance(result, list) and len(result) == 0:
            return "No emails found matching your request."
    return str(result)

# ---------------------------
# Chat API
# ---------------------------
@app.get("/")
async def root():
    return {"status": "ok", "message": "Multi-Platform Agent Backend is running with LangGraph"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        query = request.query
        logger.info(f"Received query: {query}")

        # Invoke the graph
        inputs = {"messages": [HumanMessage(content=query)]}
        result_state = await agent_app.ainvoke(inputs)

        # Get the final response from the last message
        final_message = result_state["messages"][-1]
        
        # Check if any tools were used in the path
        tool_used = None
        tool_result = None
        
        # Iterate backwards to find the last tool execution
        for msg in reversed(result_state["messages"]):
            if isinstance(msg, ToolMessage):
                # Find the corresponding tool name from the previous AI message
                for prev_msg in result_state["messages"]:
                    if isinstance(prev_msg, AIMessage) and prev_msg.tool_calls:
                        for tc in prev_msg.tool_calls:
                            if tc["id"] == msg.tool_call_id:
                                tool_used = tc["name"]
                                break
                tool_result = msg.content
                break

        if tool_used:
            # Re-apply our specialized formatting for the final frontend output
            formatted_result = format_email_results(eval(tool_result) if isinstance(tool_result, str) and tool_result.startswith('[') else tool_result, tool_used)
            
            # If the final message is just a summary of the tool, we might prefer the tool result itself
            # for the "Result" field in our UI, while the message content is the "Agent's thoughts"
            return {
                "status": "success",
                "tool_used": tool_used,
                "result": formatted_result,
                "message": final_message.content
            }
        else:
            return {
                "status": "success",
                "message": final_message.content
            }

    except Exception as e:
        logger.error(f"Unexpected error in /chat: {str(e)}")
        return {
            "status": "error",
            "message": f"Graph Execution Error: {str(e)}"
        }