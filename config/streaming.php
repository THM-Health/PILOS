<?php

return [
    'enabled' => (bool) env('STREAMING_ENABLED', false),
    'api' => env('STREAMING_API'),
    'refresh_interval' => (int) env('STREAMING_REFRESH_INTERVAL', 10),
    'show_fps' => (bool) env('STREAMING_SHOW_FPS', false),
    'auth' => [
        'type' => env('STREAMING_AUTH_TYPE', 'none'),
        'basic' => [
            'username' => env('STREAMING_AUTH_BASIC_USERNAME'),
            'password' => env('STREAMING_AUTH_BASIC_PASSWORD'),
        ],
    ],
];
