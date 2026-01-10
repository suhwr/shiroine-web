-- Migration: Add payment_number and expired_at columns to payment_history table
-- Date: 2026-01-10
-- Description: Adds payment_number and expired_at fields to support Pakasir payment gateway

-- Add payment_number column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='payment_history' AND column_name='payment_number') THEN
    ALTER TABLE payment_history ADD COLUMN payment_number TEXT;
  END IF;
END $$;

-- Add expired_at column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='payment_history' AND column_name='expired_at') THEN
    ALTER TABLE payment_history ADD COLUMN expired_at TIMESTAMP;
  END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_history' 
AND column_name IN ('payment_number', 'expired_at');
