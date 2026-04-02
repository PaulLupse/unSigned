from src.Backend.Domain.Credentials import Key

def decode_key(key:str)->Key|None:
    decoded_key = key.split('.')
    if len(decoded_key) != 2:
        return None
    return Key(keyId=decoded_key[0], formId=decoded_key[1], expires=None)

