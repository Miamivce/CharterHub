-- Create the wp_charterhub_jwt_tokens table
CREATE TABLE IF NOT EXISTS wp_charterhub_jwt_tokens (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) UNSIGNED NOT NULL,
    `token_hash` varchar(255) NOT NULL,
    `refresh_token_hash` varchar(255) DEFAULT NULL,
    `expires_at` datetime NOT NULL,
    `refresh_expires_at` datetime DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revoked` tinyint(1) NOT NULL DEFAULT 0,
    `last_used_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `token_hash` (`token_hash`),
    KEY `refresh_token_hash` (`refresh_token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy tokens from the old table if it exists
INSERT IGNORE INTO wp_charterhub_jwt_tokens 
(user_id, token_hash, refresh_token_hash, expires_at, refresh_expires_at, created_at, revoked, last_used_at)
SELECT user_id, token_hash, refresh_token_hash, expires_at, refresh_expires_at, created_at, revoked, last_used_at
FROM wp_jwt_tokens
WHERE revoked = 0; 