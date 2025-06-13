<?php

return [
    'enabled' => env('METRICS_ENABLED', false),
    'namespace' => env('METRICS_NAMESPACE', 'pilos'),
    'redis' => [
        'prefix' => 'PROMETHEUS_',
    ],
    'collectors' => [
        'request_memory_bytes' => [
            'enabled' => env('METRICS_COLLECTOR_REQUEST_MEMORY_ENABLED', true),
            'exclude_routes' => explode(',', env('METRICS_COLLECTOR_REQUEST_MEMORY_EXCLUDE_ROUTES', 'metrics')),
        ],
        'request_duration_seconds' => [
            'enabled' => env('METRICS_COLLECTOR_REQUEST_DURATION_ENABLED', true),
            'exclude_routes' => explode(',', env('METRICS_COLLECTOR_REQUEST_DURATION_EXCLUDE_ROUTES', 'metrics')),
        ],
        'request_total' => [
            'enabled' => env('METRICS_COLLECTOR_REQUEST_TOTAL_ENABLED', true),
            'exclude_routes' => explode(',', env('METRICS_COLLECTOR_REQUEST_TOTAL_EXCLUDE_ROUTES', 'metrics')),
        ],
    ],
];
