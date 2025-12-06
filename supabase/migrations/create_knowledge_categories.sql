-- Create knowledge_categories table for organizing knowledge base content
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'qa')),
    color TEXT DEFAULT 'gray',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id column to documents table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS on knowledge_categories
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on knowledge_categories" ON knowledge_categories
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO knowledge_categories (name, type, color) VALUES
    ('General', 'general', 'gray'),
    ('Pricing', 'general', 'green'),
    ('FAQs', 'qa', 'blue'),
    ('Product Info', 'general', 'purple')
ON CONFLICT DO NOTHING;
