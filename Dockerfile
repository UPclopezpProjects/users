FROM ubuntu

#Install curl
RUN apt-get update
RUN apt-get install sudo
RUN apt-get upgrade -y
RUN apt-get update
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -

#Install NodeJS
RUN apt-get install nodejs -y

#Install the MongoDB client in linux
RUN apt-get install mongodb-clients -y

#NodeJS
WORKDIR /avocado/users
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
RUN npm update
COPY . .
EXPOSE 3001
CMD ./how2Start