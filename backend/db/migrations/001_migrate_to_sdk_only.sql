-- Migration: Messages API to Agent SDK Only
-- This script drops existing tables and recreates them with SDK-specific schema
-- WARNING: This will delete all existing conversation data

-- Drop existing tables in correct order (reverse of dependencies)
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS presets CASCADE;

-- Recreate tables with Agent SDK schema
-- (The schema.sql file will be executed automatically by Docker initialization)

-- Note: To run this migration:
-- 1. Stop the containers: docker-compose down -v
-- 2. Start the containers: docker-compose up -d
-- This will re-execute schema.sql with the new SDK-only structure
