-- Migration: Add human takeover support
-- Run this in Supabase SQL Editor

-- 1. Add timeout setting to bot_settings table
ALTER TABLE bot_settings 
ADD COLUMN IF NOT EXISTS human_takeover_timeout_minutes INT DEFAULT 5;

-- 2. Create human takeover sessions table
CREATE TABLE IF NOT EXISTS human_takeover_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_sender_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_human_message_at TIMESTAMPTZ DEFAULT NOW(),
  timeout_minutes INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by sender ID
CREATE INDEX IF NOT EXISTS idx_human_takeover_sender ON human_takeover_sessions(lead_sender_id);

-- Enable RLS
ALTER TABLE human_takeover_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on human_takeover_sessions" ON human_takeover_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
