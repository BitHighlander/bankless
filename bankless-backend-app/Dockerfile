FROM node:18

RUN mkdir -p /home/app

WORKDIR /home/app

COPY api/dist ./api/dist
COPY dist ./dist


COPY .env .
COPY package.json .
COPY tsoa.json .


RUN yarn install --frozen-lockfile --production

EXPOSE 4000

ENTRYPOINT ["node", "dist/main.js"]