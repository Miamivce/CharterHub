-- Migrate data from wp_charterhub_clients to wp_charterhub_users
INSERT INTO wp_charterhub_users (
  id,
  email,
  password,
  username,
  display_name,
  first_name,
  last_name,
  role,
  verified,
  verification_token,
  verification_expires,
  last_login,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  password,
  username,
  display_name,
  first_name,
  last_name,
  'client' AS role, -- Explicitly set role to 'client'
  verified,
  verification_token,
  verification_expires,
  last_login,
  created_at,
  updated_at
FROM
  wp_charterhub_clients;

-- Update the role to ensure it matches the new ENUM format
UPDATE wp_charterhub_users
SET role = 'client'
WHERE role = 'charter_client'; 