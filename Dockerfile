FROM node:onbuild

ENV NODE_ENV=production SERVER_URL=https://api.triptrunkapp.com/parse PORT=8080

EXPOSE 8080