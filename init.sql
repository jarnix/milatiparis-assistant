-- Initialize database schema
CREATE TABLE IF NOT EXISTS product_optimizations (
  id SERIAL PRIMARY KEY,
  shopify_product_id VARCHAR(255) NOT NULL,
  original_title TEXT,
  optimized_title TEXT,
  original_description TEXT,
  optimized_description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_optimizations_status ON product_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_product_optimizations_created_at ON product_optimizations(created_at);

-- Insert sample data (optional)
-- INSERT INTO product_optimizations (shopify_product_id, original_title, status) 
-- VALUES ('gid://shopify/Product/10045716005211', 'raincoat', 'completed');