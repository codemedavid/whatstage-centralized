-- Migration: Add AI Priority Analysis fields to leads table
-- Run this in Supabase SQL Editor

-- Add attention_priority enum-like check
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attention_priority TEXT CHECK (attention_priority IN ('critical', 'high', 'medium', 'low'));

-- Add timestamp for when priority was last analyzed
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_analyzed_at TIMESTAMPTZ;

-- Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_leads_attention_priority ON leads(attention_priority) WHERE attention_priority IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN leads.attention_priority IS 'AI-assigned priority level: critical, high, medium, low';
COMMENT ON COLUMN leads.priority_analyzed_at IS 'Timestamp when the priority was last updated by AI analysis';
