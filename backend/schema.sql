-- Database schema for Shiroine Payment System

-- Users table
CREATE TABLE IF NOT EXISTS users (
    phone_number TEXT PRIMARY KEY,
    lid TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Names table (for user display names)
CREATE TABLE IF NOT EXISTS names (
    lid TEXT PRIMARY KEY,
    push_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Premium table
CREATE TABLE IF NOT EXISTS premium (
    jid TEXT NOT NULL,
    lid TEXT NOT NULL,
    special_limit INTEGER DEFAULT 0,
    max_special_limit INTEGER DEFAULT 0,
    expired TEXT,
    last_special_reset TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (jid, lid)
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    merchant_ref TEXT NOT NULL,
    phone_number TEXT,
    group_id TEXT,
    customer_name TEXT,
    method TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    plan_type TEXT,
    plan_duration TEXT,
    order_items JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_history_phone ON payment_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_payment_history_group ON payment_history(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_jid ON premium(jid);
CREATE INDEX IF NOT EXISTS idx_premium_lid ON premium(lid);
