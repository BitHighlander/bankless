FROM node:18
WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache yarn install --frozen-lockfile
COPY ./ ./
RUN yarn build
CMD yarn serve --host
