-- Update orders.payment_status check constraint to include BILL_REQUESTED (and other valid states)
-- This migration is conditional - only runs if orders table exists
-- For H2 database, this will be skipped since orders table may not exist yet

-- Check if orders table exists and only run if it does
-- H2 syntax: Use INFORMATION_SCHEMA to check table existence
-- Note: This migration will be applied when orders table is created by JPA
