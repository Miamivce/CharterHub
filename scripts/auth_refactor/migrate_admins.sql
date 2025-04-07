-- Migrate WordPress admin users to wp_charterhub_users
INSERT INTO wp_charterhub_users (
  email,
  password,
  username,
  display_name,
  first_name,
  last_name,
  role,
  verified,
  last_login,
  created_at,
  updated_at
)
SELECT
  user_email,
  user_pass,
  user_login,
  display_name,
  first_name,
  last_name,
  'admin',  -- Set role to admin
  1,        -- Set verified to true
  last_login,
  user_registered,
  NOW()
FROM
  wp_users
WHERE
  ID IN (
    SELECT user_id FROM wp_usermeta
    WHERE meta_key = 'wp_capabilities'
    AND meta_value LIKE '%administrator%'
  )
  -- Only migrate users that don't already exist in our new table
  AND user_email NOT IN (SELECT email FROM wp_charterhub_users);

-- Set phone numbers for admin users if available
UPDATE wp_charterhub_users u
JOIN wp_users w ON u.email = w.user_email
SET u.phone_number = w.phone_number
WHERE u.role = 'admin' AND w.phone_number IS NOT NULL; 