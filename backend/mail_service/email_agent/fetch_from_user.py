from mail_service.email_agent.email_connection import get_mail
import email

def extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
    else:
        return msg.get_payload(decode=True).decode(errors="ignore")

def fetch_from_user(sender, limit=100):
    mail = get_mail()

    status, messages = mail.search(None, f'FROM "{sender}"')

    if status != "OK":
        mail.logout()
        return []

    mail_ids = messages[0].split()

    if not mail_ids:
        mail.logout()
        return []

    results = []

    # ✅ only last N emails (important)
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
#     data = fetch_from_user("example@gmail.com")
#     print(data)