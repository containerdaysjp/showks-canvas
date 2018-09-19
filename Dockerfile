FROM 8-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (production only)
COPY src/package*.json ./
RUN npm install --only=production

# Bundle app source
COPY src .

EXPOSE 8080
CMD [ "npm", "start" ]
