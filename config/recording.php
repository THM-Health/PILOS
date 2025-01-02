<?php

return [
    'player' => env('RECORDING_PLAYER', '/playback/presentation/2.3'),
    'spool-sub-directory' => env('RECORDING_SPOOL_SUB_DIRECTORY', ''),
    'download_allowlist' => env('RECORDING_DOWNLOAD_ALLOWLIST', '.*'),
    'max_retention_period' => (int) env('RECORDING_MAX_RETENTION_PERIOD', -1),
    'description_limit' => (int) env('RECORDING_DESCRIPTION_LIMIT', 1000),
    'import_before_hook' => env('RECORDING_IMPORT_BEFORE_HOOK', ''),
];
