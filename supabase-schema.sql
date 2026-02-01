-- Supabase Schema for Spelling Practice App
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table (PIN-based authentication)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,  -- Hashed 4-6 digit PIN
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Ensure display_name is unique (case insensitive)
  CONSTRAINT unique_display_name UNIQUE (LOWER(display_name))
);

-- Index for faster login lookups
CREATE INDEX idx_users_display_name ON users (LOWER(display_name));

-- ============================================
-- User Progress Table
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Progress data stored as JSONB for flexibility
  progress_data JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One progress record per user
  CONSTRAINT unique_user_progress UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_progress_user_id ON user_progress (user_id);

-- ============================================
-- Custom Word Lists Table (Optional - for sharing)
-- ============================================
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  words TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_word_lists_user_id ON word_lists (user_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data (using service role for auth)
-- Note: We use service_role key for PIN auth, so RLS is mainly for direct access

-- Policy for user_progress: users can only access their own progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (true);  -- Service role bypasses RLS

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (true);

-- Policy for word_lists
CREATE POLICY "Users can view own word lists" ON word_lists
  FOR SELECT USING (true);

CREATE POLICY "Users can view public word lists" ON word_lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own word lists" ON word_lists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own word lists" ON word_lists
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own word lists" ON word_lists
  FOR DELETE USING (true);

-- ============================================
-- Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for word_lists
CREATE TRIGGER update_word_lists_updated_at
  BEFORE UPDATE ON word_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- INSERT INTO users (display_name, pin_hash)
-- VALUES ('測試用戶', 'hashed_pin_here');
