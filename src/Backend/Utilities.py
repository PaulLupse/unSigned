from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt, bcrypt

SK = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALG = "HS256"
hash_alg = PasswordHash.recommended()

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

    return jwt.encode(payload=data_copy, key=SK, algorithm=ALG)
