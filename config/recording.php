<?php

return [
    'player' => env('RECORDING_PLAYER', '/playback/presentation/2.3'),
    'spool-sub-directory' => env('RECORDING_SPOOL_SUB_DIRECTORY', ''),
    'recording_download_whitelist' => env('RECORDING_DOWNLOAD_WHITELIST', '(.*)'),
];
