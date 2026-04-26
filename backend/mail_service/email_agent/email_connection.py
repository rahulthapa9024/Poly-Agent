import imaplib
from mail_service.configs.config import EMAIL, GMAIL_PASSWORD

def get_mail():
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, GMAIL_PASSWORD)
    mail.select("inbox")
    return mail