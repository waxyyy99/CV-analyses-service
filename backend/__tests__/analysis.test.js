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

describe('Analysis', () => {
  let authToken;
  let userId;
  let resumeId;
  const timestamp = Date.now();
  let testUser = {
    email: `test_analysis_${timestamp}@example.com`,
    phone: `+1234567${timestamp.toString().slice(-4)}`,
    password: 'testpassword123',
    name: 'Test User'
  };

  beforeAll(async () => {
    // Create test user
    const registerResponse = await request(app)
      .post('/auth/register')
      .send(testUser);

    if (registerResponse.status !== 201) {
      console.error('Registration failed:', registerResponse.body);
      throw new Error('Failed to register test user');
    }
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.userId;
    
    if (!authToken) {
      throw new Error('No token received from registration');
    }

    // Upload a test resume
    const resumeContent = `
      John Doe
      Email: john@example.com
      Phone: +1234567890
      
      Experience:
      Software Developer with 5 years of experience in JavaScript, Python, React, and Node.js.
      Worked on various projects using Git, Linux, and SQL databases.
      
      Education:
      Bachelor's degree in Computer Science
      
      Skills:
      JavaScript, Python, React, Node.js, Git, Linux, SQL
    `;

    const uploadResponse = await request(app)
      .post('/resume/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from(resumeContent), {
        filename: 'test_resume.txt',
        contentType: 'text/plain'
      });

    resumeId = uploadResponse.body.resumeId;
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

  describe('POST /analyze', () => {
    test('should analyze resume successfully', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Analysis complete');
      expect(response.body).toHaveProperty('analysisId');
      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('strengths');
      expect(response.body).toHaveProperty('improvements');
      expect(response.body).toHaveProperty('detailedFeedback');

      // Check score range
      expect(response.body.overall).toBeGreaterThanOrEqual(0);
      expect(response.body.overall).toBeLessThanOrEqual(10);

      // Check categories
      expect(response.body.categories).toHaveProperty('structure');
      expect(response.body.categories).toHaveProperty('content');
      expect(response.body.categories).toHaveProperty('keywords');
      expect(response.body.categories).toHaveProperty('formatting');
      expect(response.body.categories).toHaveProperty('experience');
    });

    test('should reject analysis without resumeId', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resume ID required');
    });

    test('should reject analysis with non-existent resumeId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId: fakeId })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resume not found');
    });

    test('should reject analysis without authentication', async () => {
      const response = await request(app)
        .post('/analyze')
        .send({ resumeId })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /analyses', () => {
    test('should get analysis history', async () => {
      // First create an analysis
      await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId });

      const response = await request(app)
        .get('/analyses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('analyses');
      expect(Array.isArray(response.body.analyses)).toBe(true);
      expect(response.body.analyses.length).toBeGreaterThan(0);

      const analysis = response.body.analyses[0];
      expect(analysis).toHaveProperty('id');
      expect(analysis).toHaveProperty('resumeId');
      expect(analysis).toHaveProperty('resumeFilename');
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('createdAt');
    });

    test('should reject history request without authentication', async () => {
      const response = await request(app)
        .get('/analyses')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /analyses/:id', () => {
    let analysisId;

    beforeAll(async () => {
      // Create an analysis first
      const analyzeResponse = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId });

      analysisId = analyzeResponse.body.analysisId;
    });

    test('should get specific analysis', async () => {
      const response = await request(app)
        .get(`/analyses/${analysisId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('resumeId');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.score).toHaveProperty('overall');
      expect(response.body.score).toHaveProperty('categories');
      expect(response.body.score).toHaveProperty('strengths');
      expect(response.body.score).toHaveProperty('improvements');
    });

    test('should reject with non-existent analysisId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/analyses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Analysis not found');
    });

    test('should reject without authentication', async () => {
      const response = await request(app)
        .get(`/analyses/${analysisId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });
  });
});

