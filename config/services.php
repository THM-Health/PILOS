<?php

$shibbolethEnabled = env('SHIBBOLETH_ENABLED', false);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'poeditor' => [
        'token' => env('POEDITOR_TOKEN'),
        'project' => env('POEDITOR_PROJECT'),
        'upload_delay' => env('POEDITOR_UPLOAD_DELAY', 20),
    ],

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'shibboleth' => [
        'enabled' => $shibbolethEnabled,
        'mapping' => $shibbolethEnabled ? json_decode(file_get_contents(app_path('Auth/config/shibboleth_mapping.json'))) : null,
        'session_id_header' => env('SHIBBOLETH_SESSION_ID_HEADER', 'shib-session-id'),
        'logout' => env('SHIBBOLETH_LOGOUT_URL', '/Shibboleth.sso/Logout')
    ],
];
