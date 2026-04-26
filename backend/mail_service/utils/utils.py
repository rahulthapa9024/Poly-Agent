from bs4 import BeautifulSoup
import email
from email.header import decode_header
from datetime import datetime, timedelta
from dateutil import parser


def clean_html(html_content):
    if not html_content:
        return ""
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        
        # Get text with better separation
        text = soup.get_text(separator='\n')
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception:
        # Fallback if BeautifulSoup fails
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', html_content)


def decode_mime_header(s):
    if not s:
        return ""
    try:
        decoded_parts = decode_header(s)
        result = ""
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                result += part.decode(encoding or "utf-8", errors="ignore")
            else:
                result += part
        return result
    except Exception:
        return s


def format_email_message(msg):
    return {
        "subject": decode_mime_header(msg.get("subject")),
        "from": decode_mime_header(msg.get("from")),
        "date": msg.get("date"),
        "content": extract_email_body(msg)
    }


def normalize_date_for_imap(date_str):
    if not date_str:
        return None
    try:
        # flexible parsing for any human-readable date
        date_obj = parser.parse(date_str)
        return date_obj.strftime("%d-%b-%Y")
    except Exception:
        return date_str


def get_next_day(date_str):
    try:
        normalized = normalize_date_for_imap(date_str)
        date_obj = datetime.strptime(normalized, "%d-%b-%Y")
        next_day = date_obj + timedelta(days=1)
        return next_day.strftime("%d-%b-%Y")
    except Exception:
        return date_str


def extract_email_body(msg):
    body = ""
    html_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))

            try:
                payload = part.get_payload(decode=True)
                if payload is None:
                    continue
                payload = payload.decode(errors="ignore")
            except Exception:
                continue

            if content_type == "text/plain" and "attachment" not in content_disposition:
                body += payload
            elif content_type == "text/html" and "attachment" not in content_disposition:
                html_body += payload
    else:
        content_type = msg.get_content_type()
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                payload = payload.decode(errors="ignore")
                if content_type == "text/plain":
                    body = payload
                elif content_type == "text/html":
                    html_body = payload
        except Exception:
            pass

    # Prefer cleaned HTML if it exists, as plain text often contains placeholders
    if html_body.strip():
        cleaned = clean_html(html_body).strip()
        if cleaned:
            return cleaned
            
    if body.strip():
        return body.strip()
    
    return "No readable content found."


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