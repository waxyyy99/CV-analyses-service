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

describe('Resume Upload', () => {
  let authToken;
  let userId;
  const timestamp = Date.now();
  let testUser = {
    email: `test_resume_${timestamp}@example.com`,
    phone: `+1234567${timestamp.toString().slice(-4)}`,
    password: 'testpassword123',
    name: 'Test User'
  };

  beforeAll(async () => {
    // Create test user and get token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send(testUser);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.userId;
  });

  afterAll(async () => {
    // Cleanup: delete test data in correct order (respecting foreign keys)
    await pool.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM analyses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM resume_skills WHERE resume_id IN (SELECT id FROM resumes WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM resumes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /resume/upload', () => {
    test('should upload text file successfully', async () => {
      const textContent = 'John Doe\nEmail: john@example.com\nPhone: +1234567890\nExperience: Software Developer';
      
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(textContent), {
          filename: 'resume.txt',
          contentType: 'text/plain'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Resume uploaded');
      expect(response.body).toHaveProperty('resumeId');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('extractedText');
    });

    test('should reject upload without authentication', async () => {
      const textContent = 'Test resume content';
      
      const response = await request(app)
        .post('/resume/upload')
        .attach('file', Buffer.from(textContent), {
          filename: 'resume.txt',
          contentType: 'text/plain'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject unsupported file type', async () => {
      const response = await request(app)
        .post('/resume/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test content'), {
          filename: 'resume.doc',
          contentType: 'application/msword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

