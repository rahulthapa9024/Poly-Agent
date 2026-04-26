from mail_service.email_agent.email_connection import get_mail
from mail_service.utils.utils import format_email_message
from datetime import datetime
import email

def fetch_today(limit=100):
    mail = get_mail()

    today = datetime.now().strftime("%d-%b-%Y")
    query = f'SINCE "{today}"'

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
                results.append(format_email_message(msg))

    mail.logout()
    return results


# # usage
# if __name__ == "__main__":
#     data = fetch_today(5)
#     print(data)