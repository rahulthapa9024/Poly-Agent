import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH= os.getenv("TELEGRAM_API_HASH")