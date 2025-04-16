<?php

return [
    'enabled' => (bool) env('STREAMING_ENABLED', false),
    'api' => env('STREAMING_API'),
    'server_timeout' => (int) env('STREAMING_SERVER_TIMEOUT', 10),
    'server_connect_timeout' => (int) env('STREAMING_SERVER_CONNECT_TIMEOUT', 20),
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
