# unSigned

## Descriere

Acest proiect este menit pentru a dezvolta un serviciu de creare și completare a unor formulare complet anonime, oferind 
o interfață utilizarilor prin intermediul unui site web. 

## Rulare proiect

Rularea proiectului se poate efectua în două metode:
- Clasic, rulând fiecare server în parte (frontend, backend, mongodb)
- Containerizat, folosind docker


Întrucât aplicația se folosește de variabile de mediu (environment variables), care nu sunt distribuite alături de codul
sursă și fișierele de configurație, este necesară setarea următoarelor variabile de mediu:

    
    SENDER_EMAIL
    GMAIL_APP_PASSWORD
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    SECURE_JWT_KEY
    JWT_ALG
    SECURE_PYSETO_KEY
    ACCESS_TOKEN_LIFESPAN_MINUTES
    REFRESH_TOKEN_LIFESPAN_DAYS

    DB_ADDRESS
    FRONTEND_PORT
    BACKEND_ADDRESS

1) _SECURE_JWT_KEY_: o cheie de 256 de biți, sub format hexazecimal
2) _SECURE_PYSETO_KEY_: o cheie de 256 de biți, sub format hexazecimal
3) _BACKEND_ADDRESS_: adresa server-ului FastAPI 
4) _JWT_ALG_: algoritmul pt semnarea JWT-urilor
5) _DB_ADDRESS_: adresa bazei de date, în acest caz MongoDB (de regulă mongodb://localhost:27017/)
6) _SENDER_EMAIL_: adresa care trimite email-urile având cheile de acces. Email-ul trebuie să fie gmail și contul gmail trebuie să aibă pornită autentificarea în doi pași
7) _GMAIL_APP_PASSWORD_: parola de aplicație, configurată în contul google
8) _GOOGLE_CLIENT_ID_: id-ul clientului google, pentru implementarea autentificării automate prin google
9) _GOOGLE_CLIENT_SECRET_: secret-ul clientului google, pentru implementarea autentificării automate prin google
10) _ACCESS_TOKEN_LIFESPAN_MINUTES_: Durata de viață a unui token de autentificare, exprimată în minute
11) _REFRESH_TOKEN_LIFESPAN_DAYS_: Durata de viață a unui token de refresh, exprimată în zile

Variabilele ce țin de conectivitate nu sunt necesare pentru rularea containerizată.

## Rulare containerizată

Rularea containerizată presupune capacitatea de a rula containere Docker pe mașina dorită, necesitând anumite elemente:
docker engine, docker CLI, WSL (În cazul rulării în Windows), Docker Desktop (opțional). 

Rularea containerizată se folosește de fișiere Dockerfiles custom pentru serviciile de backend și frontend
și de imaginea docker pentru mongodb; aceste servicii sunt conectate prin intermediul docker compose, având mai mule 
configurații:

- Dezvoltare (dev): Se folosește de webpack-dev-server pentru servirea resurselor specifice frontend-ului
- Producție (prod) (WIP): Se folosește de nginx pentru servirea resurselor specifice frontend-ului

În ambele dintre cazuri, rularea se realizează prin intermediul a câte unei linii de comandă specifice:

- Dezvoltare:

    docker compose -f docker-compose.dev.yaml -f docker-compose.yaml up -d --build

- Producție:

    docker compose -f docker-compose.prod.yaml -f docker-compose.yaml up -d --build

## Rulare clasică

### Rularea serverului de backend

Pentru a putea rula serverul de backend este necesară instalarea modulelor python, listate în fișierul requirements.txt,
din directorul de bază. 

Instalarea se realizează prin intermediul unui terminal deschis în directorul principal, folosind următoarea comandă

    pip install -r requirements.txt

În urma instalării modulelor, este necesară, de asemenea, activarea mediului virtual python, folosind următoarea comandă:

    ./.venv/Scripts/activate    

În final, rularea server-ului de backend se realizează folosind următoarea comandă:

    uvicorn main:app


### Rularea serverului web

Pentru a putea rula serverul de backend este necesară instalarea modulelor node, a căror nume se regăsesc în fișierul de
configurare package.json din directorul de bază. Instalarea modulelor se realizează folosind următoarea linie de comandă:

    npm install

Rularea serverului web se efectuează prin următoarea linie de comandă:

    npm start


## Licență

MIT Liscense