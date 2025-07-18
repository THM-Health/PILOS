<?php

return [
    'enabled' => env('ANTIVIRUS_ENABLED', false),
    'clamav' => [
        'url' => env('ANTIVIRUS_CLAMAV_URL'),
    ],
];
