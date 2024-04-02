<?php

return [
    'player' => env('RECORDING_PLAYER', '/playback/presentation/2.3'),
    'spool-sub-directory' => env('RECORDING_SPOOL_SUB_DIRECTORY', ''),
    'download_whitelist' => env('RECORDING_DOWNLOAD_WHITELIST', '(.*)'),
    'max_retention_period' => (int) env('RECORDING_MAX_RETENTION_PERIOD', -1),
];
