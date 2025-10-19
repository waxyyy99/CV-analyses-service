# Базовый образ: Node.js 18 на Alpine (лёгкий)
FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json (для кэширования deps)
COPY package*.json ./

# Устанавливаем зависимости (только один раз при билде)
RUN npm i

# Копируем весь код проекта
COPY . .

# Открываем порт для Vite (5173 внутри контейнера)
EXPOSE 5173

# Команда запуска: dev-режим с host и без автооткрытия

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--open", "false"]
