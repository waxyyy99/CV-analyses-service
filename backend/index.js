const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
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

// Mock data for users and analyses (temporary storage)
let mockUsers = {};
let mockAnalyses = {};
let mockResumes = {};

// ===== API Routes =====

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
    if (mockUsers[email]) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    mockUsers[email] = {
      id: userId,
      email,
      phone,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken(userId);
    res.status(201).json({ message: 'User registered', token, userId });
  } catch (err) {
    console.error(err);
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

    const user = mockUsers[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
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

    const resumeId = uuidv4();
    const extractedText = req.file.buffer.toString('utf-8');

    mockResumes[resumeId] = {
      id: resumeId,
      userId: req.user.userId,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      extractedText,
      uploadedAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Resume uploaded',
      resumeId,
      filename: req.file.originalname,
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

    if (!resumeId || !mockResumes[resumeId]) {
      return res.status(400).json({ error: 'Resume not found' });
    }

    const resume = mockResumes[resumeId];
    const text = resume.extractedText;

    // Simulate ML analysis with mock scores
    const analysisId = uuidv4();
    const mockScore = generateMockAnalysis(text);

    mockAnalyses[analysisId] = {
      id: analysisId,
      userId: req.user.userId,
      resumeId,
      score: mockScore,
      createdAt: new Date().toISOString(),
    };

    res.json({
      message: 'Analysis complete',
      analysisId,
      ...mockScore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Get Analysis History
app.get('/analyses', authenticateToken, async (req, res) => {
  try {
    const userAnalyses = Object.values(mockAnalyses).filter(
      (a) => a.userId === req.user.userId
    );

    res.json({
      analyses: userAnalyses.map((a) => ({
        id: a.id,
        resumeId: a.resumeId,
        resumeFilename: mockResumes[a.resumeId]?.filename,
        score: a.score.overall,
        createdAt: a.createdAt,
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
    const analysis = mockAnalyses[req.params.id];

    if (!analysis || analysis.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

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
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
