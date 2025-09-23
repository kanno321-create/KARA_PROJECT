-- KARA PROJECT Database Schema
-- Korean Industrial Software System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CUSTOMERS (à ô)
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    business_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. PRODUCTS (ˆ tÈ\ø)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    unit_price DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    stock_quantity INTEGER DEFAULT 0,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. BREAKERS ((è0 ô)
-- =============================================
CREATE TABLE IF NOT EXISTS breakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50), -- ACB, MCCB, ELB, etc
    voltage INTEGER,
    current_rating INTEGER,
    breaking_capacity INTEGER,
    poles INTEGER,
    mounting_type VARCHAR(50),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. ENCLOSURES (h´ ô)
-- =============================================
CREATE TABLE IF NOT EXISTS enclosures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50), -- PANEL, BOX, CABINET
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    material VARCHAR(50),
    ip_rating VARCHAR(10),
    color VARCHAR(50),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. ESTIMATES (¬)
-- =============================================
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, approved, rejected
    valid_until DATE,
    subtotal DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. ESTIMATE_ITEMS (¬ m©)
-- =============================================
CREATE TABLE IF NOT EXISTS estimate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2),
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 10,
    line_total DECIMAL(15, 2),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);