import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")
EMAIL = os.getenv("EMAIL")