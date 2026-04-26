from langchain.tools import tool
from typing import Optional, Any


"""
_______________________________________________

Telegram Tools

_______________________________________________
"""
from telegram_service.telegram_agent.telegram_read import TelegramReader
telegram_reader = TelegramReader()
@tool
async def read_telegram_messages(user: str, limit: Any = None):
    """
    Read recent Telegram messages from a user, group, or channel.

    Args:
        user: Telegram username/channel/group
        limit: Number of recent messages to fetch
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 10
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 10
    
    return await telegram_reader.read_messages(user, actual_limit)


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
def fetch_emails_by_date(start_date: str, end_date: str, limit: Any = None):
    """
    Fetch emails between a start date and end date.

    IMPORTANT: BOTH dates MUST be in format DD-MMM-YYYY (e.g., 01-Apr-2026).
    Convert any other date format to this before calling.

    Args:
        start_date: Start date in format DD-MMM-YYYY
        end_date: End date in format DD-MMM-YYYY
        limit: Maximum number of recent emails to fetch
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 10
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 10
    return fetch_date_range(start_date, end_date, actual_limit)


from mail_service.email_agent.fetch_from_user import fetch_from_user
@tool
def fetch_emails_from_sender(sender: str, limit: Any = None):
    """
    Fetch emails from a specific sender email address.

    Args:
        sender: Email address of sender
                Example: example@gmail.com
        limit: Maximum number of recent emails to fetch
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 100
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 100
    return fetch_from_user(sender, actual_limit)


from mail_service.email_agent.fetch_last_n import fetch_last_n
@tool
def fetch_recent_emails(n: Any = None):
    """
    Fetch the most recent emails from the inbox.

    Args:
        n: Number of latest emails to retrieve
    """
    try:
        if n is None or isinstance(n, dict):
            actual_n = 100
        else:
            actual_n = int(n)
    except (ValueError, TypeError):
        actual_n = 100
    return fetch_last_n(actual_n)


from mail_service.email_agent.fetch_on_date import fetch_on_date
@tool
def fetch_emails_on_date(date: str, limit: Any = None):
    """
    Fetch emails received on a specific date.

    IMPORTANT: Date MUST be in format DD-MMM-YYYY (e.g., 01-Apr-2026).
    Convert any other date format to this before calling.

    Args:
        date: Date in format DD-MMM-YYYY
        limit: Maximum number of emails to fetch
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 100
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 100
    return fetch_on_date(date, actual_limit)


from mail_service.email_agent.fetch_today import fetch_today
@tool
def fetch_today_emails(limit: Any = None):
    """
    Fetch emails received today.

    Args:
        limit: Maximum number of emails to retrieve
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 100
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 100
    return fetch_today(actual_limit)


from mail_service.email_agent.fetch_user_on_date import fetch_user_on_date
@tool
def fetch_sender_emails_on_date(
    sender: str,
    date: str,
    limit: Any = None
):
    """
    Fetch emails from a specific sender on a specific date.

    IMPORTANT: Date MUST be in format DD-MMM-YYYY (e.g., 01-Apr-2026).
    Convert any other date format to this before calling.

    Args:
        sender: Sender email address
        date: Date in format DD-MMM-YYYY
        limit: Maximum number of emails to fetch
    """
    try:
        if limit is None or isinstance(limit, dict):
            actual_limit = 100
        else:
            actual_limit = int(limit)
    except (ValueError, TypeError):
        actual_limit = 100
    return fetch_user_on_date(sender, date, actual_limit)


from mail_service.email_agent.send_email import send_email as send_mail_func
@tool
def send_email(to_email: str, subject: str, message: str):
    """
    Send an email to a recipient.

    Args:
        to_email: Recipient's email address
                  Example: balaonfire1@gmail.com
        subject: Subject line of the email
        message: Content of the email
    """
    return send_mail_func(to_email, subject, message)


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


"""
_______________________________________________

General Conversation Tool

_______________________________________________
"""
@tool
def general_chat(query: str):
    """
    Use this tool for general conversation, answering questions, brainstorming, 
    or when the user just wants to talk without performing a specific action 
    like sending emails or searching the web.
    """
    return f"I'm here to help! Regarding '{query}', I think we can discuss this further. What specific details would you like to explore?"