from twilio.rest import Client
from whatsapp_service.configs.config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN
)


class WhatsAppSender:
    def __init__(self):
        self.client = Client(
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN
        )
        self.from_number = "whatsapp:+14155238886"  # Twilio sandbox

    def send_text(self, to_number: str, message: str):
        try:
            # Clean input
            to_number = to_number.strip()

            # Prevent duplicate whatsapp prefix
            if to_number.startswith("whatsapp:"):
                formatted_to = to_number
            else:
                formatted_to = f"whatsapp:{to_number}"

            print("Sending to:", repr(formatted_to))

            msg = self.client.messages.create(
                from_=self.from_number,
                to=formatted_to,
                body=message
            )

            return {
                "status": f"Successfully sent message to {formatted_to}",
                "sid": msg.sid
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


# if __name__ == "__main__":
#     sender = WhatsAppSender()

#     result = sender.send_text(
#         "whatsapp:+919664997058",
#         "Hello from whatsapp_service"
#     )

#     print(result)