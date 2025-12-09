// Test setup - runs before all tests
const { Pool } = require('pg');

// Use test database if available, otherwise use main DB
process.env.DB_NAME = process.env.TEST_DB_NAME || process.env.DB_NAME || 'cv_analysis';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

