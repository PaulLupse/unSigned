FROM python:3.13-alpine AS base

WORKDIR /app

COPY requirements.txt ./
COPY .env ./

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install -r requirements.txt


FROM base AS developement
# stage folosit pt dev
# accesul la fisierele sursa se face printr-un bind mount catre folderul src din backend (pt a putea folosi hot reloading)

# ip-ul trebuie sa fie 0.0.0.0 cand serverul este rulat intr-un container
CMD ["uvicorn", "src.main:app", "--log-level=debug", "--host=0.0.0.0", "--port=8000", "--reload"]

FROM base AS production
# stage folosit pt productie

COPY src ./src

CMD ["uvicorn", "src.main:app", "--log-level=debug", "--host=0.0.0.0", "--port=8000", "--reload"]