#FROM debian
FROM itzg/minecraft-bedrock-server

# install node.js
RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

WORKDIR /opt

COPY package.json .
RUN npm install

COPY mc-wrapper.js mc-console.js mc-backup.js ./

WORKDIR /data
ENTRYPOINT ["node", "/opt/mc-wrapper.js"]