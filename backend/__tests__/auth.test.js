const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../index');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'cv_analysis',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT) || 5432,
});

describe('Authentication', () => {
  const timestamp = Date.now();
  let testUser = {
    email: `test_${timestamp}@example.com`,
    phone: `+1234567${timestamp.toString().slice(-4)}`,
    password: 'testpassword123',
    name: 'Test User'
  };

  afterAll(async () => {
    // Cleanup test user
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    await pool.end();
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User registered');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password
          // missing phone and name
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('All fields required');
    });

    test('should reject duplicate email registration', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe(testUser.name);
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Email and password required');
    });
  });
});

