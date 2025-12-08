-- Product Variations Schema
-- Supports multiple variation types (Size, Color, etc.) with different prices per product

-- =====================================================
-- Table: product_variation_types
-- Defines the types of variations (e.g., Size, Color, Material)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variation_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_variation_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on product_variation_types"
ON product_variation_types FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- Table: product_variations  
-- Links products to variation types with specific values and prices
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variation_type_id UUID NOT NULL REFERENCES product_variation_types(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- e.g., "Small", "Medium", "Large" or "Red", "Blue"
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one value per type per product
    UNIQUE(product_id, variation_type_id, value)
);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on product_variations"
ON product_variations FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_type_id ON product_variations(variation_type_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_product_variation_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variation_types_updated_at
    BEFORE UPDATE ON product_variation_types
    FOR EACH ROW
    EXECUTE FUNCTION update_product_variation_types_updated_at();

CREATE OR REPLACE FUNCTION update_product_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variations_updated_at
    BEFORE UPDATE ON product_variations
    FOR EACH ROW
    EXECUTE FUNCTION update_product_variations_updated_at();

-- Insert default variation types
INSERT INTO product_variation_types (name, display_order) VALUES
    ('Size', 1),
    ('Color', 2)
ON CONFLICT DO NOTHING;
