const express = require('express');
const { Pool } = require('pg'); // импортируем PostgreSQL клиент
require('dotenv').config(); // .env file

const app = express();
const port = 3000;

// Настройки подключения к базе

const pool = new Pool({
  user: process.env.DB_USER || 'default_user',  // fallback, если не задан
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,  // fallback на стандартный порт
});

// Пример маршрута для проверки соединения
app.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // простой запрос
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
