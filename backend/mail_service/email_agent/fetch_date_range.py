from mail_service.email_agent.email_connection import get_mail
import email

def fetch_date_range(start_date, end_date, limit=10):
    mail = get_mail()

    query = f'(SINCE "{start_date}" BEFORE "{end_date}")'
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

                results.append({
                    "subject": msg.get("subject"),
                    "from": msg.get("from"),
                    "date": msg.get("date"),
                })

    mail.logout()
    return results

# # usage
# if __name__ == "__main__":
#     data = fetch_date_range("01-Apr-2026", "10-Apr-2026")
#     print(data)