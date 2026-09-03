import os, dotenv

# Acest script este folosit pentru centralizarea variabilelor de mediu (environment variables), pentru a evita repetarea
# accesarii acestora prin intermediul clasei os in fie care script dependent de acestea.

dotenv.load_dotenv()
try:

    DB_URL = os.environ["DB_ADDRESS"]
    GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
    GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
    ACCESS_TOKEN_LIFESPAN_MINUTES = float(os.environ["ACCESS_TOKEN_LIFESPAN_MINUTES"]) # Durata de viata in minute
    REFRESH_TOKEN_LIFESPAN_DAYS= float(os.environ["REFRESH_TOKEN_LIFESPAN_DAYS"]) # Durata de viata in zile
    SECURE_JWT_KEY = os.environ["SECURE_JWT_KEY"]
    JWT_ALG = os.environ["JWT_ALG"]
    SECURE_PYSETO_KEY = os.environ["SECURE_PYSETO_KEY"]
    SENDER_EMAIL = os.environ["SENDER_EMAIL"]
    GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]

except KeyError as e:
    raise ValueError(f'Environment variable "{e.args[0]}" not specified.')





