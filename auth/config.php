<?php

// In generate_jwt_token function (around its beginning, after function declaration)
// ... existing code ...
if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log('generate_jwt_token: Using secret key: ' . JWT_AUTH_SECRET_KEY);
    error_log('generate_jwt_token: User data: ' . print_r($user_data, true));
}
// ... existing code ...

// In decode_jwt_token_allow_expired function (at the start of the function body)
// ... existing code ...
if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log('decode_jwt_token_allow_expired: Using secret key: ' . JWT_AUTH_SECRET_KEY);
    error_log('decode_jwt_token_allow_expired: Token received: ' . $token);
}
// ... existing code ... 