FROM keymetrics/pm2:latest-alpine

RUN mkdir -p /data
WORKDIR /data
# Bundle APP files
#COPY package.json .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install

# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "pm2.json" ]

EXPOSE 3000