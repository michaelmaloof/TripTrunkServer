FROM node:onbuild

ENV NODE_ENV=development SERVER_URL=https://api-dev.triptrunkapp.com/parse PORT=8080

EXPOSE 8080