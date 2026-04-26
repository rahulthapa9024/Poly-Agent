import email
from datetime import datetime, timedelta


def get_next_day(date_str):
    date_obj = datetime.strptime(date_str, "%d-%b-%Y")
    next_day = date_obj + timedelta(days=1)
    return next_day.strftime("%d-%b-%Y")


def print_emails(mail, mail_ids, limit=5):
    for i in mail_ids[-limit:]:
        status, msg_data = mail.fetch(i, "(RFC822)")

        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])

                print("📧 Subject:", msg["subject"])
                print("👤 From:", msg["from"])
                print("📅 Date:", msg["date"])
                print("-" * 40)