-- Script to drop the old wp_charterhub_clients table
-- This will permanently remove the table and all its data

-- Drop the table
DROP TABLE IF EXISTS wp_charterhub_clients;

-- Confirm success
SELECT 'wp_charterhub_clients table has been dropped successfully' AS message; 