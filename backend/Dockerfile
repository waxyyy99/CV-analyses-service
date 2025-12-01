FROM node:20-alpine
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy package files
COPY package*.json ./

# Clean npm cache and install with build-from-source
RUN npm cache clean --force && npm install

# Build bcrypt explicitly for Alpine
RUN npm rebuild bcrypt --build-from-source

# Copy source code (node_modules from COPY . will be overwritten by earlier steps)
COPY . .

EXPOSE 3000
CMD ["npm", "start"]

