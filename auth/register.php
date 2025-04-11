<?php

// For ALL registration types, check if email exists
$existing_email_user = fetchRow(
    "SELECT id FROM {$db_config['table_prefix']}charterhub_users WHERE email = ?",
    [strtolower($data['email'])]
);

// Check if username already exists
$existing_username = fetchRow(
    "SELECT id FROM {$db_config['table_prefix']}charterhub_users WHERE username = ?",
    [$username]
);

// DEBUG: Show the SQL that will be executed
$sql = "
    INSERT INTO {$db_config['table_prefix']}charterhub_users 
    (email, username, password, first_name, last_name, display_name, 
    phone_number, company, role, verified, verification_token, 
    created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'client', 0, ?, 
    NOW(), NOW())
"; 