import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

print(f"Checking index: {index_name}")
try:
    desc = pc.describe_index(index_name)
    print(f"Current Index Description: {desc}")
    
    if desc.dimension != 768:
        print(f"Dimension mismatch! Index is {desc.dimension}, but model is 768.")
        print("Would you like to recreate the index with 768 dimensions? (This will delete existing data in the index)")
        # In a real script we'd ask, here I'll just provide the command to do it if requested.
    else:
        print("Dimensions match (768).")
except Exception as e:
    print(f"Error: {e}")
