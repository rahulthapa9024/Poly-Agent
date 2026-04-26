from langchain.tools import tool


"""
_______________________________________________

Telegram Tools

_______________________________________________
"""
from telegram_service.telegram_agent.telegram_read import TelegramReader
telegram_reader = TelegramReader()
@tool
async def read_telegram_messages(user: str, limit: int = 10):
    """
    Read recent Telegram messages from a user, group, or channel.

    Args:
        user: Telegram username/channel/group
        limit: Number of recent messages to fetch
    """
    
    return await telegram_reader.read_messages(user, limit)


from telegram_service.telegram_agent.telegram_send import TelegramSender
telegram_sender = TelegramSender()
@tool
async def send_telegram_message(user: str, message: str):
    """
    Send a Telegram message to a specific user, group, or channel.

    Args:
        user: Telegram username, group name, or channel username
        message: Message content to send
    """
    
    return await telegram_sender.send(user, message)


"""
_______________________________________________

WhatsApp Tools

_______________________________________________
"""
from whatsapp_service.whatsapp_agent.send_text import WhatsAppSender
whatsapp_sender = WhatsAppSender()
@tool
def send_whatsapp_message(to_number: str, message: str):
    """
    Send a WhatsApp message to a phone number.

    Args:
        to_number: Recipient phone number in international format 
                   (example: +919664997058)
        message: Message content to send
    """
    
    return whatsapp_sender.send_text(to_number, message)



"""
_______________________________________________

Email Tools

_______________________________________________
"""
from mail_service.email_agent.fetch_date_range import fetch_date_range
@tool
def fetch_emails_by_date(start_date: str, end_date: str, limit: int = 10):
    """
    Fetch emails between a start date and end date.

    Args:
        start_date: Start date in format DD-MMM-YYYY
                    Example: 01-Apr-2026
        end_date: End date in format DD-MMM-YYYY
                  Example: 10-Apr-2026
        limit: Maximum number of recent emails to fetch
    """

    return fetch_date_range(start_date, end_date, limit)


from mail_service.email_agent.fetch_from_user import fetch_from_user
@tool
def fetch_emails_from_sender(sender: str, limit: int = 100):
    """
    Fetch emails from a specific sender email address.

    Args:
        sender: Email address of sender
                Example: example@gmail.com
        limit: Maximum number of recent emails to fetch
    """

    return fetch_from_user(sender, limit)


from mail_service.email_agent.fetch_last_n import fetch_last_n
@tool
def fetch_recent_emails(n: int = 100):
    """
    Fetch the most recent emails from the inbox.

    Args:
        n: Number of latest emails to retrieve
    """

    return fetch_last_n(n)


from mail_service.email_agent.fetch_on_date import fetch_on_date
@tool
def fetch_emails_on_date(date: str, limit: int = 100):
    """
    Fetch emails received on a specific date.

    Args:
        date: Date in format DD-MMM-YYYY
              Example: 01-Apr-2026
        limit: Maximum number of emails to fetch
    """

    return fetch_on_date(date, limit)


from mail_service.email_agent.fetch_today import fetch_today
@tool
def fetch_today_emails(limit: int = 100):
    """
    Fetch emails received today.

    Args:
        limit: Maximum number of emails to retrieve
    """

    return fetch_today(limit)


from mail_service.email_agent.fetch_user_on_date import fetch_user_on_date
@tool
def fetch_sender_emails_on_date(
    sender: str,
    date: str,
    limit: int = 100
):
    """
    Fetch emails from a specific sender on a specific date.

    Args:
        sender: Sender email address
                Example: recruiter@gmail.com

        date: Date in format DD-MMM-YYYY
              Example: 01-Apr-2026

        limit: Maximum number of emails to fetch
    """

    return fetch_user_on_date(sender, date, limit)


"""
_______________________________________________

Web Tools using tavily

_______________________________________________
"""
from web_services.tavily_service import search_web
@tool
def web_search(query: str):
    """
    Search the web for latest information.

    Args:
        query: Search query
    """

    response = search_web(query)

    return response["results"]