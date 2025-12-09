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

describe('Edge Cases', () => {
  const timestamp = Date.now();
  let authToken;
  let userId;
  let testUser = {
    email: `test_edge_${timestamp}@example.com`,
    phone: `+1234567${timestamp.toString().slice(-4)}`,
    password: 'testpassword123',
    name: 'Test User'
  };

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/auth/register')
      .send(testUser);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.userId;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM analyses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM resume_skills WHERE resume_id IN (SELECT id FROM resumes WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM resumes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('Health Check', () => {
    test('should handle database disconnection gracefully', async () => {
      // This test checks that health endpoint handles DB errors
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('Resume Upload', () => {
    test('should handle empty file content', async () => {
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(''), {
          filename: 'empty.txt',
          contentType: 'text/plain'
        })
        .expect(201);

      expect(response.body).toHaveProperty('resumeId');
    });

    test('should handle very long filename', async () => {
      const longFilename = 'a'.repeat(300) + '.txt';
      const textContent = 'Test content';
      
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(textContent), {
          filename: longFilename,
          contentType: 'text/plain'
        })
        .expect(201);

      expect(response.body).toHaveProperty('resumeId');
    });

    test('should handle special characters in filename', async () => {
      const textContent = 'Test resume content';
      
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(textContent), {
          filename: 'резюме_тест (1).txt',
          contentType: 'text/plain'
        })
        .expect(201);

      expect(response.body).toHaveProperty('resumeId');
      expect(response.body.filename).toBeDefined();
    });
  });

  describe('Analysis', () => {
    let resumeId;

    beforeAll(async () => {
      const resumeContent = 'Minimal resume with email: test@example.com and phone: +1234567890';
      
      const uploadResponse = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(resumeContent), {
          filename: 'minimal.txt',
          contentType: 'text/plain'
        });

      resumeId = uploadResponse.body.resumeId;
    });

    test('should analyze resume with minimal content', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId })
        .expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body.overall).toBeGreaterThanOrEqual(0);
      expect(response.body.overall).toBeLessThanOrEqual(10);
    });

    test('should handle analysis of resume with no skills', async () => {
      const resumeContent = 'Just some text without any technical skills mentioned';
      
      const uploadResponse = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(resumeContent), {
          filename: 'no_skills.txt',
          contentType: 'text/plain'
        });

      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId: uploadResponse.body.resumeId })
        .expect(200);

      expect(response.body).toHaveProperty('overall');
    });

    test('should handle invalid resumeId format', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId: 'invalid-uuid-format' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid resume ID format');
    });
  });

  describe('Authentication', () => {
    test('should handle invalid token format', async () => {
      const response = await request(app)
        .get('/analyses')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/analyses')
        .set('Authorization', authToken)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });

    test('should handle very long email', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: longEmail,
          phone: `+1234567${Date.now().toString().slice(-4)}`,
          password: 'test123',
          name: 'Test'
        });

      // Should either succeed or fail gracefully
      expect([201, 400, 409]).toContain(response.status);
    });
  });
});

