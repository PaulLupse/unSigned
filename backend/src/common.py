import logging

from pymongo import MongoClient
from slowapi import Limiter
from slowapi.util import get_remote_address

from src.config import DB_URL

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)
mongo_client = MongoClient(DB_URL)
