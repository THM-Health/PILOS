<?php

use App\Enums\RecordingMode;

return [
    'mode' => RecordingMode::tryFrom(Str::upper(env('RECORDING_MODE', ''))) ?: RecordingMode::INTEGRATED,
    'player' => env('RECORDING_PLAYER', '/playback/presentation/2.3'),
    'spool-sub-directory' => env('RECORDING_SPOOL_SUB_DIRECTORY', ''),
    'download_allowlist' => env('RECORDING_DOWNLOAD_ALLOWLIST', '.*'),
    'max_retention_period' => (int) env('RECORDING_MAX_RETENTION_PERIOD', -1),
    'description_limit' => (int) env('RECORDING_DESCRIPTION_LIMIT', 1000),
];
