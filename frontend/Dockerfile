# folosim build stage-uri multiple pentru a facilita rularea aplicatiei in mod de "dezvoltare" si de "productie"

FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

FROM base AS developement

# stage folosit doar la productie
# fisierele nu sunt copiate intrucat acestea vor fii accesate printr-un volume mount specificat in docker-compose.override

CMD [ "npm","run", "dev" ]

FROM base AS builder

# stage folosit pentru "cladirea" codului
# de la acest stage in colo se considera mediu de producite (de aceea copiem tot ce trebuie)

COPY tsconfig.json webpack.config.cjs ./
COPY src ./src
COPY static ./static

RUN npm run build

FROM nginx:alpine AS production

# copiem script-urile
COPY --from=builder /app/dist /usr/share/nginx/html
# copiem imaginile
COPY static/images /usr/share/nginx/static/images

COPY nginx.conf.template /etc/nginx/templates/

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]