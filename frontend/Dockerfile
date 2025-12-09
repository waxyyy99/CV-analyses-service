# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Открываем порт для Vite (5173 внутри контейнера)
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
