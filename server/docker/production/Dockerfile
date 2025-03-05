# Stage 1

FROM node:latest as builder

WORKDIR /build

COPY package*.json .
RUN npm install

COPY src/ src/
COPY logs/ logs/
COPY tsconfig.json tsconfig.json

RUN npm run dist



# Stage 2

FROM node:latest as runner

WORKDIR /app


COPY --from=builder build/package*.json .
COPY --from=builder build/node_modules node_modules/
COPY --from=builder build/dist dist/


ENV ENV=production

EXPOSE 5000

# CMD [ "npm", "start" ]
CMD ["node" ,"dist/server/server.js"]