-- Migration to fix latitude/longitude precision issue
-- PostgreSQL FLOAT only stores ~6-7 decimal places
-- DOUBLE PRECISION stores ~15 decimal places (needed for GPS coordinates)

ALTER TABLE visits 
ALTER COLUMN latitude TYPE DOUBLE PRECISION,
ALTER COLUMN longitude TYPE DOUBLE PRECISION,
ALTER COLUMN accuracy TYPE DOUBLE PRECISION;
