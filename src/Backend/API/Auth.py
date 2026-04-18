import json

from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt, bcrypt, dotenv, os, pyseto, uuid
from pyseto.exceptions import DecryptError, SignError

from src.Backend.Domain.Credentials import Key, KeyFooter, KeyPayload

dotenv.load_dotenv()

ALG = "HS256"
hash_alg = PasswordHash.recommended()

SECURE_KEY:str|None = os.getenv("SECURE_KEY")
SECURE_PYSETO_KEY:str|None = os.getenv("SECURE_PYSETO_KEY")

if SECURE_KEY is None: raise ValueError("SECURE_KEY not set")
if SECURE_PYSETO_KEY is None: raise ValueError("SECURE_PYSETO_KEY not set")

paseto_key = pyseto.Key.new(version=4, purpose='local', key=bytes(SECURE_PYSETO_KEY, 'utf-8'))

# creeaza un hash dintr-o parola folosind bcrypt si un 'salt' generat aleator
# ia ca parametru o parola
# returneaza parola hash-uita, impreuna cu 'salt'-ul generat
def hash_password(plain_password : str) -> (str, str):

    byte_password:bytes = plain_password.encode("utf-8")
    salt:bytes = bcrypt.gensalt(rounds=10)
    hashed_password:bytes = bcrypt.hashpw(password=byte_password, salt=salt)

    return hashed_password.decode("utf8"), salt.decode("utf8")

def verify_password(plain_password:str, hashed_password:str, salt:str) -> bool:

    byte_hashed_password:bytes = hashed_password.encode("utf-8")
    byte_salt:bytes = salt.encode("utf-8")
    byte_plain_password:bytes = plain_password.encode("utf-8")

    byte_plain_password_hashed:bytes = bcrypt.hashpw(byte_plain_password, byte_salt)

    return byte_hashed_password == byte_plain_password_hashed

def generate_access_token(data : dict, expiration_time : timedelta | None = None):

    data_copy = dict(data)
    if expiration_time:
        expiration_date = datetime.now(timezone.utc) + expiration_time
    else:
        expiration_date = datetime.now(timezone.utc) + timedelta(minutes=5)

    data_copy.update({"exp":expiration_date})

    return jwt.encode(payload=data_copy, key=SECURE_KEY, algorithm=ALG)


def generate_key(data:Key)->str:

    data.footer.keyId = str(uuid.uuid4())
    token:str = pyseto.encode(payload=data.payload.model_dump(), key=paseto_key, footer=data.footer.model_dump()).decode("utf-8")
    return token

def decode_key(token)->Key|None:

    try:
        decoded = pyseto.decode(keys=paseto_key, token=token)
        payload = json.loads(decoded.payload.decode("utf-8"))
        keyId = json.loads(decoded.footer.decode("utf-8"))['keyId']

        return Key(payload=KeyPayload(formId=payload['formId']), footer=KeyFooter(keyId=keyId))

    except DecryptError:
        print("Could not decode paseto token")
        return None