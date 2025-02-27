<?php

return [
    'enabled' => env('STREAMING_ENABLED', false),
    'api' => env('STREAMING_API'),
    'refresh_interval' => intval(env('STREAMING_REFRESH_INTERVAL', 10)),
    'auth' => [
        'type' => env('STREAMING_AUTH_TYPE', 'none'),
        'basic' => [
            'username' => env('STREAMING_AUTH_BASIC_USERNAME'),
            'password' => env('STREAMING_AUTH_BASIC_PASSWORD'),
        ],
    ],
];
