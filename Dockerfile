FROM node:onbuild

ENV NODE_ENV=production SERVER_URL=http://triptrunk-server-dev.us-east-1.elasticbeanstalk.com/parse PORT=8080

EXPOSE 8080