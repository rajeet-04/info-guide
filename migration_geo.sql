-- Migration: Add Geolocation Columns to Visits Table
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT,
ADD COLUMN IF NOT EXISTS accuracy FLOAT;
