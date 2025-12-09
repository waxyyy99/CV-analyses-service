const request = require('supertest');
// Import app before starting server
process.env.NODE_ENV = 'test';
const app = require('../index');

describe('Health Check', () => {
  test('GET /health should return ok status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toBe('connected');
  });
});

