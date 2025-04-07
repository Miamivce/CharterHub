-- This SQL command will delete the duplicate customer created in the most recent profile update
-- This is for Test3@me.com - looking for the most recently created user with this email

-- First, check the duplicate customer (to verify before deleting)
SELECT ID, user_login, user_email, display_name, user_registered 
FROM wp_users 
WHERE LOWER(user_email) = LOWER('test3@me.com')
ORDER BY user_registered DESC 
LIMIT 2;

-- Then, delete the most recently created duplicate user (replace XX with the ID from above):
-- DELETE FROM wp_users WHERE ID = XX;

-- Also delete user metadata for the deleted user:
-- DELETE FROM wp_usermeta WHERE user_id = XX;
