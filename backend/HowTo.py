#Working
# from whatsapp_service.whatsapp_agent.send_text import WhatsAppSender
# Sender = WhatsAppSender ()
# result = Sender.send_text("whatsapp:+919664997058","Hello from whatsapp_service")
# print(result)

# Working
# import asyncio
# from telegram_service.telegram_agent.telegram_read import TelegramReader

# async def main():
#     reader = TelegramReader()

#     result = await reader.read_messages(
#         user="rahulthapa9024",
#         limit=100
#     )

#     print(result)

# asyncio.run(main())

#Working

# import asyncio
# from telegram_service.telegram_agent.telegram_send import TelegramSender

# async def main():
#     sender = TelegramSender()

#     result = await sender.send(user="rahulthapa9024",message="Hello How are you??")

#     print(result)

# asyncio.run(main())

# from mail_service.email_agent.fetch_date_range import fetch_date_range
# from mail_service.email_agent.fetch_from_user import fetch_from_user
# from mail_service.email_agent.fetch_last_n import fetch_last_n
# from mail_service.email_agent.fetch_on_date import fetch_on_date
# from mail_service.email_agent.fetch_today import fetch_today
# from mail_service.email_agent.fetch_user_on_date import fetch_user_on_date


# result1 = fetch_date_range("01-Jan-2024", "31-Jan-2024")
# result2 = fetch_from_user("tamthapa001@gmail.com")
# result3 = fetch_last_n(10)
# result4 = fetch_on_date("01-Jan-2024")
# result5 = fetch_today(5)
# result6 = fetch_user_on_date("tamthapa001@gmail.com", "01-Jan-2024")

# print("Result 1:", result1)
# print("Result 2:", result2)
# print("Result 3:", result3)
# print("Result 4:", result4)
# print("Result 5:", result5)
# print("Result 6:", result6)