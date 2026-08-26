import re

email_pattern = re.compile("\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*")

def validate_email(email:str)->bool:
    return bool(email_pattern.match(email))