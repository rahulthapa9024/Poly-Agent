import sys
import os

# Keep your existing path setup ✅
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from telethon import TelegramClient
from configs.config import TELEGRAM_API_ID, TELEGRAM_API_HASH


class TelegramReader:
    def __init__(self):
        self.api_id = TELEGRAM_API_ID
        self.api_hash = TELEGRAM_API_HASH
        self.client = TelegramClient("session_name", self.api_id, self.api_hash)
        self.started = False

    async def start(self):
        if not self.started:
            await self.client.start()
            self.started = True

    async def read_messages(self, user: str, limit: int = 100):
        try:
            await self.start()
            messages = []

            async for msg in self.client.iter_messages(user, limit=limit):
                messages.append({
                    "text": msg.text,
                    "date": str(msg.date),
                    "sender_id": msg.sender_id
                })

            return messages

        except Exception as e:
            return {"status": "error", "error": str(e)}