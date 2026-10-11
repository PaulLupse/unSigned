import json

from src.main import app

print(json.dumps(app.openapi()))