FROM node:14-alpine
 WORKDIR /app
 COPY . .
 RUN apk update && apk add --no-cache openssh-keygen openssl
 RUN npm install -y
 CMD ["node", "app.js"]