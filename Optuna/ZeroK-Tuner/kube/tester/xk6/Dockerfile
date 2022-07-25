FROM node
# RUN ["apt-get","update"]
# RUN ["apt-get","install","-y","vim"]
WORKDIR /usr/src/app
COPY ./ .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
