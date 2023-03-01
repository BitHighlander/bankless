FROM node:latest

RUN mkdir -p /home/app

WORKDIR /home/app

COPY api/dist ./api/dist
COPY dist ./dist

COPY package.json .
COPY tsoa.json .
COPY .env .

RUN yarn install --frozen-lockfile --production

# RUN yarn build:all

EXPOSE 4000

ENTRYPOINT ["node", "dist/main.js"]