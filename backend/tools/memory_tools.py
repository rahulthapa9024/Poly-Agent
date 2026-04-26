import os
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_core.tools import tool
from pinecone import Pinecone

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

# Initialize Embeddings
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Initialize Vector Store
vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)

@tool
def save_to_memory(content: str):
    """
    Saves important information, facts, or context to long-term memory.
    Use this to remember user preferences, important details from previous conversations, 
    or key facts found during research.
    """
    try:
        vectorstore.add_texts([content])
        return f"Successfully saved to memory: {content[:50]}..."
    except Exception as e:
        return f"Error saving to memory: {str(e)}"

@tool
def search_memory(query: str):
    """
    Searches long-term memory for relevant information, past conversations, or facts.
    Use this when the user asks something you might have discussed before or when you need 
    to retrieve saved context.
    """
    try:
        docs = vectorstore.similarity_search(query, k=3)
        if not docs:
            return "No relevant information found in memory."
        
        results = []
        for i, doc in enumerate(docs):
            results.append(f"Result {i+1}:\n{doc.page_content}")
        
        return "\n\n".join(results)
    except Exception as e:
        return f"Error searching memory: {str(e)}"
