-- Initialize PostgreSQL with required extensions and schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  consent_for_processing BOOLEAN DEFAULT false,
  data_retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  original_filename TEXT,
  content_type TEXT,
  file_size_bytes INTEGER,
  storage_path TEXT,
  extracted_text TEXT,
  language TEXT,
  is_anonymized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  retention_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at);

-- analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model_version_id UUID,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  scores JSONB,
  analysis_output JSONB,
  advice JSONB,
  notes TEXT
);

CREATE INDEX idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_finished_at ON analyses(finished_at);

-- skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  normalized_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- resume_skills table (N:M relationship)
CREATE TABLE IF NOT EXISTS resume_skills (
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  confidence NUMERIC(4,3),
  level TEXT,
  PRIMARY KEY (resume_id, skill_id)
);

-- model_versions table
CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  framework TEXT,
  version_tag TEXT,
  deployed_at TIMESTAMPTZ,
  config JSONB,
  notes TEXT
);

-- audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT,
  object_type TEXT,
  object_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
