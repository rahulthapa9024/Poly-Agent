import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from mail_service.configs.config import EMAIL, GMAIL_PASSWORD

def send_email(to_email, subject, body):
    if not EMAIL or not GMAIL_PASSWORD:
        return "Email configuration missing (EMAIL or GMAIL_PASSWORD not set)."

    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        # Add body
        msg.attach(MIMEText(body, 'plain'))

        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL, GMAIL_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(EMAIL, to_email, text)
        server.quit()

        return f"Email sent successfully to {to_email}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"

# Usage
if __name__ == "__main__":
    # result = send_email("recipient@example.com", "Test Subject", "Hello from Multi-Platform Agent!")
    # print(result)
    pass
