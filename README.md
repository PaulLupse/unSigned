# unSigned

## Descriere

Acest proiect este menit pentru a dezvolta un serviciu de creare și completare a unor formulare complet anonime, oferind 
o interfață utilizarilor prin intermediul unui site web. 

## Rulare proiect

Rularea proiectului necesită rularea a două servere: cel de backend (FastAPI & Uvicorn) și cel web (Node.js &
Webpack dev server).

Întrucât aplicația se folosește de variabile de mediu (environment variables), care nu sunt distribuite alături de codul
sursă și fișierele de configurație, este necesară setarea următoarelor variabile de mediu:

    SECURE_JWT_KEY
    SECURE_PYSETO_KEY
    BACKEND_ADDRESS
    FRONTEND_PORT
    JWT_ALG
    DB_ADDRESS
    SENDER_EMAIL
    GMAIL_APP_PASSWORD

1) SECURE_JWT_KEY: o cheie de 256 de biți, sub format hexazecimal
2) SECURE_PYSETO_KEY: o cheie de 256 de biți, sub format hexazecimal
3) BACKEND_ADDRESS: adresa server-ului FastAPI (default http://127.0.0.1:8000)
4) JWT_ALG: algoritmul pt semnarea JWT-ului
5) DB_ADDRESS: adresa bazei de date, în acest caz MongoDB (de regulă mongodb://localhost:27017/)
6) SENDER_EMAIL: adresa care trimite email-urile având cheile de acces. Email-ul trebuie să fie gmail și contul gmail trebuie să aibă pornită autentificarea în doi pași
7) GMAIL_APP_PASSWORD: parola de aplicație, configurată în contul google

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

### Note

Se poate rula aplicatia prin intermediul containerelor docker, voi detalia acest proces in push-uri ulterioare.


## Licență

MIT Liscense