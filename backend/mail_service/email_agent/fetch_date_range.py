from mail_service.email_agent.email_connection import get_mail
from mail_service.utils.utils import format_email_message, normalize_date_for_imap
import email

def fetch_date_range(start_date, end_date, limit=10):
    mail = get_mail()

    # Normalize dates for IMAP (DD-Mon-YYYY)
    start_norm = normalize_date_for_imap(start_date)
    end_norm = normalize_date_for_imap(end_date)

    query = f'(SINCE "{start_norm}" BEFORE "{end_norm}")'
    status, messages = mail.search(None, query)

    if status != "OK":
        mail.logout()
        return []

    mail_ids = messages[0].split()

    if not mail_ids:
        mail.logout()
        return []

    results = []

    # ✅ get last N emails (important for AI efficiency)
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
#     data = fetch_date_range("01-Apr-2026", "10-Apr-2026")
#     print(data)