FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json webpack.config.cjs ./
COPY src ./src
COPY static ./static

EXPOSE 3000

CMD [ "npm", "start" ]