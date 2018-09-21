# Stage 0
FROM node:8-alpine

WORKDIR /build
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev
RUN npm install canvas --only=production

# Stage 1
FROM node:8-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy built modules
COPY --from=0 /build/node_modules ./node_modules

# Install app dependencies (production only)
RUN apk add --no-cache \
    cairo \
    jpeg
COPY src/package*.json ./
RUN npm install --only=production

# Bundle app source
COPY src .

EXPOSE 8080
CMD [ "npm", "start" ]
