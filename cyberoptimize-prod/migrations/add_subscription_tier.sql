-- SQL Migration: Add Subscription Tier and Contract Tracking to PROFILES
-- Run this against your live Supabase / PostgreSQL database

-- Add subscription_tier and contracts_count to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;

-- Optional: Initialize existing users to 'starter'
UPDATE profiles SET subscription_tier = 'starter' WHERE subscription_tier IS NULL;
UPDATE profiles SET contracts_count = 0 WHERE contracts_count IS NULL;
