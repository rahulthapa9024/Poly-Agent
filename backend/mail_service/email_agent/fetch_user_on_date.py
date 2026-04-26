from mail_service.email_agent.email_connection import get_mail
from mail_service.utils.utils import get_next_day
import email

def extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
    else:
        return msg.get_payload(decode=True).decode(errors="ignore")

def fetch_user_on_date(sender, date, limit=10):
    mail = get_mail()

    next_day = get_next_day(date)
    query = f'(FROM "{sender}" SINCE "{date}" BEFORE "{next_day}")'

    status, messages = mail.search(None, query)

    if status != "OK":
        mail.logout()
        return []

    mail_ids = messages[0].split()

    if not mail_ids:
        mail.logout()
        return []

    results = []

    for i in mail_ids[-limit:]:
        status, msg_data = mail.fetch(i, "(RFC822)")

        for part in msg_data:
            if isinstance(part, tuple):
                msg = email.message_from_bytes(part[1])

                results.append({
                    "subject": msg.get("subject"),
                    "from": msg.get("from"),
                    "date": msg.get("date"),
                    "body": extract_body(msg)
                })

    mail.logout()
    return results

# # usage
# if __name__ == "__main__":
#     data = fetch_user_on_date("example@gmail.com", "01-Apr-2026")
#     print(data)