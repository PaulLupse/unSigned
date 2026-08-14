FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt ./
COPY .env ./

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install -r requirements.txt

COPY src ./src

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--log-level=debug", "--host=0.0.0.0", "--port=8000"]