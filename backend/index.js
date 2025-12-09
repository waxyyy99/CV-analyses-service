const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'cv_analysis',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT) || 5432,
});

// Multer config for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Helper: Authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper: Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Database initialization check
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(-1);
  }
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cv_analysis',
      user: process.env.DB_USER || 'postgres',
    });
    return false;
  }
}

// ===== API Routes =====

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ===== AUTH Routes =====

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    if (!email || !phone || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, created_at`,
      [email, phone, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);
    res.status(201).json({ message: 'User registered', token, userId: user.id });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ message: 'Login successful', token, userId: user.id, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== RESUME Routes =====

// Upload Resume
app.post('/resume/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedText = '';

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr);
        return res.status(400).json({ error: 'Failed to parse PDF file' });
      }
    } else if (req.file.mimetype === 'text/plain') {
      extractedText = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Remove null bytes and other invalid UTF-8 characters
    extractedText = extractedText.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize filename encoding - ensure it's valid UTF-8
    let normalizedFilename = req.file.originalname;
    try {
      // Remove any invalid UTF-8 characters
      normalizedFilename = normalizedFilename.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      // Ensure it's valid UTF-8 by encoding/decoding
      normalizedFilename = Buffer.from(normalizedFilename, 'utf8').toString('utf8');
    } catch (err) {
      console.error('Filename normalization error:', err);
      // Fallback: use sanitized version
      normalizedFilename = req.file.originalname.replace(/[^\w\s.-]/g, '_');
    }

    const result = await pool.query(
      `INSERT INTO resumes (user_id, original_filename, content_type, file_size_bytes, extracted_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, original_filename, created_at`,
      [req.user.userId, normalizedFilename, req.file.mimetype, req.file.size, extractedText]
    );

    const resume = result.rows[0];

    // Extract and save skills
    const extractedSkills = extractSkills(extractedText);
    if (extractedSkills.length > 0) {
      await saveResumeSkills(resume.id, extractedSkills);
    }

    // Log audit
    await logAudit(req.user.userId, 'upload', 'resume', resume.id, {
      filename: req.file.originalname,
      fileSize: req.file.size,
      contentType: req.file.mimetype
    });

    res.status(201).json({
      message: 'Resume uploaded',
      resumeId: resume.id,
      filename: resume.original_filename,
      extractedText: extractedText.substring(0, 500), // preview
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ===== ANALYSIS Routes =====

// Analyze Resume (Mock ML response)
app.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID required' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume ID format' });
    }

    // Get resume from database
    const resumeResult = await pool.query(
      'SELECT id, extracted_text, user_id FROM resumes WHERE id = $1 AND deleted_at IS NULL',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];

    // Verify ownership
    if (resume.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const text = resume.extracted_text || '';

    // Extract skills from text
    const extractedSkills = extractSkills(text);

    // Get or create model version
    const modelVersionId = await getOrCreateModelVersion();

    // Simulate ML analysis with mock scores
    const mockScore = generateMockAnalysis(text);

    // Save analysis to database
    const analysisResult = await pool.query(
      `INSERT INTO analyses (resume_id, user_id, model_version_id, status, score, scores, analysis_output, advice, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       RETURNING id, finished_at`,
      [
        resumeId,
        req.user.userId,
        modelVersionId,
        'completed',
        mockScore.overall,
        JSON.stringify(mockScore.categories),
        JSON.stringify({
          strengths: mockScore.strengths,
          improvements: mockScore.improvements,
          detailedFeedback: mockScore.detailedFeedback,
        }),
        JSON.stringify(mockScore),
      ]
    );

    const analysis = analysisResult.rows[0];

    // Save skills to database
    if (extractedSkills.length > 0) {
      await saveResumeSkills(resumeId, extractedSkills);
    }

    // Log audit
    await logAudit(req.user.userId, 'analyze', 'resume', resumeId, {
      analysisId: analysis.id,
      score: mockScore.overall,
      skillsCount: extractedSkills.length
    });

    res.json({
      message: 'Analysis complete',
      analysisId: analysis.id,
      ...mockScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Helper: Fix filename encoding
function fixFilenameEncoding(filename) {
  if (!filename) return filename;
  
  try {
    // If it contains \u sequences, decode them
    if (filename.includes('\\u')) {
      filename = filename.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });
    }
    
    // Try to fix Latin-1 interpreted as UTF-8
    // If the string contains mojibake patterns, try to fix it
    const buffer = Buffer.from(filename, 'latin1');
    const fixed = buffer.toString('utf8');
    
    // Check if fixed version looks more valid (contains Cyrillic or common chars)
    if (fixed !== filename && /[а-яА-ЯёЁ]/.test(fixed)) {
      return fixed;
    }
    
    return filename;
  } catch (err) {
    return filename;
  }
}

// Get Analysis History
app.get('/analyses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.resume_id, a.score, a.finished_at, r.original_filename
       FROM analyses a
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE a.user_id = $1 AND a.status = 'completed'
       ORDER BY a.finished_at DESC`,
      [req.user.userId]
    );

    res.json({
      analyses: result.rows.map((row) => ({
        id: row.id,
        resumeId: row.resume_id,
        resumeFilename: fixFilenameEncoding(row.original_filename),
        score: row.score,
        createdAt: row.finished_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// Get Single Analysis
app.get('/analyses/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.resume_id, a.user_id, a.score, a.scores, a.analysis_output, a.advice, a.finished_at
       FROM analyses a
       WHERE a.id = $1 AND a.status = 'completed'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis = result.rows[0];

    // Verify ownership
    if (analysis.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Reconstruct the analysis response format
    let advice = {};
    let scores = {};
    let output = {};
    
    try {
      advice = analysis.advice ? (typeof analysis.advice === 'string' ? JSON.parse(analysis.advice) : analysis.advice) : {};
    } catch (e) {
      console.error('Error parsing advice:', e);
    }
    
    try {
      scores = analysis.scores ? (typeof analysis.scores === 'string' ? JSON.parse(analysis.scores) : analysis.scores) : {};
    } catch (e) {
      console.error('Error parsing scores:', e);
    }
    
    try {
      output = analysis.analysis_output ? (typeof analysis.analysis_output === 'string' ? JSON.parse(analysis.analysis_output) : analysis.analysis_output) : {};
    } catch (e) {
      console.error('Error parsing analysis_output:', e);
    }

    res.json({
      id: analysis.id,
      userId: analysis.user_id,
      resumeId: analysis.resume_id,
      score: {
        overall: analysis.score,
        categories: scores,
        strengths: output.strengths || [],
        improvements: output.improvements || [],
        detailedFeedback: output.detailedFeedback || [],
      },
      createdAt: analysis.finished_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// ===== Helper Functions =====

// Extract skills from text
function extractSkills(text) {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
    'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask',
    'postgresql', 'mysql', 'mongodb', 'redis',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'git', 'linux', 'bash', 'sql', 'html', 'css', 'sass',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch',
    'agile', 'scrum', 'ci/cd', 'jenkins', 'github actions'
  ];

  const textLower = text.toLowerCase();
  const foundSkills = [];

  for (const skill of commonSkills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)]; // Remove duplicates
}

// Save or get skill ID
async function getOrCreateSkill(skillName) {
  const normalizedName = skillName.toLowerCase().trim();
  const displayName = skillName.trim();
  
  // Try to find existing skill by normalized name or exact name
  const existing = await pool.query(
    'SELECT id FROM skills WHERE normalized_name = $1 OR LOWER(name) = $1',
    [normalizedName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new skill
  const result = await pool.query(
    'INSERT INTO skills (name, normalized_name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name RETURNING id',
    [displayName, normalizedName]
  );

  return result.rows[0].id;
}

// Save skills for resume
async function saveResumeSkills(resumeId, skills) {
  // Delete existing skills for this resume
  await pool.query('DELETE FROM resume_skills WHERE resume_id = $1', [resumeId]);

  // Insert new skills
  for (const skillName of skills) {
    const skillId = await getOrCreateSkill(skillName);
    await pool.query(
      'INSERT INTO resume_skills (resume_id, skill_id, confidence) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [resumeId, skillId, 0.8] // Mock confidence
    );
  }
}

// Get or create model version
async function getOrCreateModelVersion() {
  const versionName = 'mock-v1.0';
  
  const existing = await pool.query(
    'SELECT id FROM model_versions WHERE name = $1',
    [versionName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO model_versions (name, framework, version_tag, deployed_at, config)
     VALUES ($1, $2, $3, now(), $4)
     RETURNING id`,
    [versionName, 'mock', '1.0', JSON.stringify({ type: 'mock', version: '1.0' })]
  );

  return result.rows[0].id;
}

// Audit log helper
async function logAudit(userId, action, objectType, objectId, payload = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, object_type, object_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, objectType, objectId, JSON.stringify(payload)]
    );
  } catch (err) {
    console.error('Audit log error:', err);
    // Don't fail the request if audit logging fails
  }
}

// ===== Mock Analysis Function =====

function generateMockAnalysis(text) {
  const wordCount = text.trim().split(/\s+/).length;
  const hasEmail = /\S+@\S+\.\S+/.test(text);
  const hasPhone = /\+?\d[\d\s\-\(\)]{8,}/.test(text);
  const hasExperience = /опыт|experience|работал|worked|junior|senior|developer/i.test(text);
  const hasEducation = /образование|education|университет|university|bachelor|master/i.test(text);
  const hasSkills = /навыки|skills|технологии|technologies|javascript|python|react/i.test(text);

  // Calculate category scores (0-10)
  const structure =
    (hasEmail ? 2 : 0) +
    (hasPhone ? 2 : 0) +
    (hasExperience ? 2 : 0) +
    (hasEducation ? 2 : 0) +
    (hasSkills ? 2 : 0);

  const content = Math.min(10, Math.floor((wordCount / 200) * 10));
  const keywords = Math.floor(Math.random() * 3) + 6; // 6-9
  const formatting = Math.floor(Math.random() * 2) + 7.5; // 7.5-9.5
  const experience = hasExperience ? Math.floor(Math.random() * 3) + 6.5 : 4; // 6.5-9.5 or 4

  const overall = Math.round((structure + content + keywords + formatting + experience) / 5 * 10) / 10;

  const strengths = [];
  const improvements = [];

  if (hasEmail && hasPhone) strengths.push('Contact information present');
  if (hasEducation) strengths.push('Education section found');
  if (hasExperience) strengths.push('Work experience included');
  if (wordCount > 300) strengths.push('Good content length');

  if (!hasEmail) improvements.push('Add email address');
  if (!hasPhone) improvements.push('Add phone number');
  if (!hasExperience) improvements.push('Include work experience');
  if (!hasSkills) improvements.push('Add technical skills');
  if (wordCount < 200) improvements.push('Expand resume content');
  if (structure < 6) improvements.push('Improve resume structure with clear sections');

  return {
    overall,
    categories: {
      structure: Math.round(structure * 10) / 10,
      content: Math.round(content * 10) / 10,
      keywords: Math.round(keywords * 10) / 10,
      formatting: Math.round(formatting * 10) / 10,
      experience: Math.round(experience * 10) / 10,
    },
    strengths,
    improvements,
    detailedFeedback: [
      {
        category: 'Structure',
        score: Math.round(structure * 10) / 10,
        feedback: 'Resume structure is ' + (structure > 7 ? 'good' : structure > 5 ? 'adequate' : 'needs improvement'),
      },
      {
        category: 'Content',
        score: Math.round(content * 10) / 10,
        feedback: 'Content is ' + (content > 7 ? 'comprehensive' : 'could be expanded'),
      },
      {
        category: 'Keywords',
        score: Math.round(keywords * 10) / 10,
        feedback: 'Industry keywords are ' + (keywords > 7 ? 'well used' : 'could be improved'),
      },
      {
        category: 'Formatting',
        score: Math.round(formatting * 10) / 10,
        feedback: 'Resume formatting is ' + (formatting > 8 ? 'excellent' : 'acceptable'),
      },
      {
        category: 'Experience',
        score: Math.round(experience * 10) / 10,
        feedback: hasExperience ? 'Experience section is present' : 'Consider adding work experience',
      },
    ],
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Only log errors in non-test environment or if it's not a fileFilter error
  if (process.env.NODE_ENV !== 'test' || !err.message?.includes('Only PDF and text files are allowed')) {
    console.error(err);
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  // Handle fileFilter errors
  if (err.message && err.message.includes('Only PDF and text files are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

// Export app for testing
module.exports = app;

// Export pool for cleanup in tests
if (process.env.NODE_ENV === 'test') {
  module.exports.pool = pool;
}

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
