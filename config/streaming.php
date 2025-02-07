<?php

return [
    'enabled' => env('STREAMING_ENABLED', false),
    'api' => env('STREAMING_API'),
    'auth' => [
        'type' => env('STREAMING_AUTH_TYPE', 'none'),
        'basic' => [
            'username' => env('STREAMING_AUTH_BASIC_USERNAME'),
            'password' => env('STREAMING_AUTH_BASIC_PASSWORD'),
        ],
    ],
];
