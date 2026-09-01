import yagmail, dotenv, os
from random import shuffle

from src.api.auth.utils import generate_key
from src.config import SENDER_EMAIL, GMAIL_APP_PASSWORD
from src.domain.auth import Key, KeyPayload

dotenv.load_dotenv()

# Distribuie chei catre utilizatorii avand email-urile listate. Pentru fiecare email este generat o noua cheie chiar
# inainte de trimiterea email-ului. Email-ul nu intra in generarea cheii, aceasta depinzand doar de id-ul formularului
# pentru care este oferit accesul.
async def distribute_keys(emails:list[str], form_owner_username:str, form_id:str) -> None:

    shuffle(emails)

    with yagmail.SMTP(user=SENDER_EMAIL, password=GMAIL_APP_PASSWORD) as yag:

        for i in range(0, len(emails)):
            yag.send(to=emails[i],
                     subject=f"Key to access a form created by user {form_owner_username} on unSigned.",
                     contents=f'''Key:\n <h1> {generate_key(data=Key(payload=KeyPayload(formId=form_id)))} </h1> 
                     \nComplete the form here: http://localhost:3000/complete-form/{form_id}''')