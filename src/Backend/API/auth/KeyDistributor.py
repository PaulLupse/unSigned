import yagmail, dotenv, os
from random import shuffle

dotenv.load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
if not SENDER_EMAIL:
    raise ValueError("SENDER_EMAIL .env variable not set")

GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
if not GMAIL_APP_PASSWORD:
    raise ValueError("GMAIL_APP_PASSWORD .env variable not set")


# functie pentru distribuirea cheilor catre utilizatorii avand emailurile listate
async def distribute_keys(emails:list[str], keys:list[str], form_owner_username:str, form_id:str) -> None:

    if len(emails)!=len(keys): raise ValueError('Emails and Keys must have the same length')

    # nu e nevoie sa stim care cheie la cine se trimite (intrucat fiecare cheie ofera accesul la acelasi formular)
    shuffle(emails)
    shuffle(keys)

    with yagmail.SMTP(user=os.getenv("SENDER_EMAIL"), password=os.getenv("GMAIL_APP_PASSWORD")) as yag:

        for i in range(0, len(emails)):
            yag.send(to=emails[i],
                     subject=f"Key to access a form created by user {form_owner_username} on unSigned.",
                     contents=f"Key: {keys[i]} \nComplete the form here: http://localhost:3000/complete-form/{form_id}")

if __name__ == "__main__":

    distribute_keys(["lupsepaul2006@gmail.com", "pp422820@gmail.com"], ["lol1", "lol2"], "lol")