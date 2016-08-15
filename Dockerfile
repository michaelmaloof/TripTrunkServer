FROM node:onbuild

ENV NODE_ENV=development SERVER_URL=http://triptrunk-server-prod.us-east-1.elasticbeanstalk.com/parse PORT=8080

EXPOSE 8080