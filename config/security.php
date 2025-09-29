<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Security Headers
    |--------------------------------------------------------------------------
    |
    | This file is for storing the settings for security-related HTTP headers.
    | These headers help protect the application from various web vulnerabilities.
    |
    */

    // Referrer Policy header configuration
    // See https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#referrer-policy
    'referrer_policy' => env('REFERRER_POLICY', 'strict-origin-when-cross-origin'),

    // HTTP Strict Transport Security (HSTS) configuration
    // See https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html
    // Be aware of the implications of enabling HSTS, especially the preload option
    'hsts' => [
        'enabled' => (bool) env('HSTS_ENABLED', false),
        'max_age' => (int) env('HSTS_MAX_AGE', 31536000),
        'include_subdomains' => (bool) env('HSTS_INCLUDE_SUBDOMAINS', false),
        'preload' => (bool) env('HSTS_PRELOAD', false),
    ],
];
