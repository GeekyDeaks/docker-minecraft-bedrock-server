# Bedrock Minecraft Server Wrapper

simple wrapper to pipe stdin/stdout to websockets around the minecraft server
image from https://github.com/itzg/docker-minecraft-bedrock-server

# get started

1. clone the repo

        git clone https://github.com/GeekyDeaks/docker-minecraft-bedrock-server.git
        cd docker-minecraft-bedrock-server

2. build the image

        docker build -t mcb-server .

3. create an environment file and edit as required

        cp template.env .env

4. run the server

        docker run --rm -it -d -v $(pwd)/data:/data --env-file .env --name mcb-server -p 19132:19132/udp mcb-server

# running backups

    docker exec -i mcb-server node /opt/mc-backup.js

    (crontab -u USERNAME -l ; echo "5 4 * * *  /usr/bin/docker exec -i mcb-server node /opt/mc-backup.js") | crontab -u USERNAME -

look in `data/backups` for the zip files

# connecting to the server console

    docker exec -it mcb-server node /opt/mc-console.js
