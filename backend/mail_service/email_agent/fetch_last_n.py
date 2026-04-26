from mail_service.email_agent.email_connection import get_mail
import email

def extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
    else:
        return msg.get_payload(decode=True).decode(errors="ignore")

def fetch_last_n(n=5):
    mail = get_mail()

    status, messages = mail.search(None, "ALL")

    if status != "OK":
        mail.logout()
        return []

    mail_ids = messages[0].split()

    if not mail_ids:
        mail.logout()
        return []

    results = []

    # ✅ last N emails
    for i in mail_ids[-n:]:
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
#     data = fetch_last_n(5)
#     print(data)