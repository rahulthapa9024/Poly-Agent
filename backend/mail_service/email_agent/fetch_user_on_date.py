from mail_service.email_agent.email_connection import get_mail
from mail_service.utils.utils import get_next_day, format_email_message, normalize_date_for_imap
import email

def fetch_user_on_date(sender, date, limit=100):
    mail = get_mail()

    date_norm = normalize_date_for_imap(date)
    next_day = get_next_day(date_norm)
    query = f'(FROM "{sender}" SINCE "{date_norm}" BEFORE "{next_day}")'

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
#     data = fetch_user_on_date("example@gmail.com", "01-Apr-2026")
#     print(data)