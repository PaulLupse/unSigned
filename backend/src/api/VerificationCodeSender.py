import dotenv, os
import yagmail

from src.config import SENDER_EMAIL, GMAIL_APP_PASSWORD

dotenv.load_dotenv()


# Trimite un e-mail catre adresa de email specificata, continand codul de verificare a adresei.
def send_verification_email(code, email)->bool:
    try:

        with yagmail.SMTP(user=SENDER_EMAIL, password=GMAIL_APP_PASSWORD) as yag:
            yag.send(to=email,
                 subject=f"Verify your email.",
                 contents=f"Use this verification code to verify your email address: \n {code} \n  Warning: The code will expire in 5 minutes.")

        return True

    except Exception:
        return False

