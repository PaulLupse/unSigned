import json, secrets, hashlib

from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt, bcrypt, dotenv, os, pyseto, uuid

from src.config import SECURE_PYSETO_KEY, SECURE_JWT_KEY
from src.domain.auth import Key, KeyFooter, KeyPayload

dotenv.load_dotenv()

ALG = "HS256"
hash_alg = PasswordHash.recommended()


paseto_key = pyseto.Key.new(version=4, purpose='local', key=bytes(SECURE_PYSETO_KEY, 'utf-8'))

# creeaza un hash dintr-o parola folosind bcrypt si un 'salt' generat aleator
# ia ca parametru o parola
# returneaza parola hash-uita
def hash_password(plain_password : str) -> str:

    byte_password:bytes = plain_password.encode("utf-8")
    salt:bytes = bcrypt.gensalt(rounds=12)
    hashed_password:bytes = bcrypt.hashpw(password=byte_password, salt=salt)

    return hashed_password.decode("utf8")

# verifica validitatea parolei plain
def verify_password(plain_password:str, hashed_password:str) -> bool:

    byte_hashed_password:bytes = hashed_password.encode("utf-8")
    byte_plain_password:bytes = plain_password.encode("utf-8")

    return bcrypt.checkpw(byte_plain_password, byte_hashed_password)

# genereaza un token de autentificare
def generate_access_token(data : dict, expiration_time : timedelta | None = None):

    data_copy = dict(data)
    if expiration_time:
        expiration_date = datetime.now(timezone.utc) + expiration_time
    else:
        expiration_date = datetime.now(timezone.utc) + timedelta(minutes=5)

    data_copy.update({"exp":expiration_date})

    return jwt.encode(payload=data_copy, key=SECURE_JWT_KEY, algorithm=ALG)

# genereaza un refresh token, care expira dupa numarul precizat de zile
def generate_refresh_token() -> tuple[str, str]:

    rf_tok:str = secrets.token_urlsafe(32)
    hash_rf_tok:str = hashlib.sha256(rf_tok.encode("utf-8")).hexdigest()

    return rf_tok, hash_rf_tok

# genereaza o cheie de access pentru un chestionar
def generate_key(data:Key)->str:

    data.footer.keyId = str(uuid.uuid4())
    token:str = pyseto.encode(payload=data.payload.model_dump(), key=paseto_key, footer=data.footer.model_dump()).decode("utf-8")
    return token

# valideaza si decodeaza o cheie de access pentru un chestionar
def decode_key(token:str)->Key|None:

    try:
        decoded = pyseto.decode(keys=paseto_key, token=token.strip(' '))
        payload = json.loads(decoded.payload.decode("utf-8"))
        keyId = json.loads(decoded.footer.decode("utf-8"))['keyId']

        return Key(payload=KeyPayload(formId=payload['formId']), footer=KeyFooter(keyId=keyId))

    except Exception as e:
        print(token)
        # print("Could not decode paseto token: " + str(e))
        return None
