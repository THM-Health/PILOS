<?php

return [
    'enabled' => explode(',', env('PLUGINS', '')),
    'contracts' => [
        \App\Plugins\Contracts\ServerLoadCalculationPluginContract::class,
        \App\Plugins\Contracts\OpenCastRecordingPluginContract::class,
    ],
    'namespaces' => [
        'defaults' => 'App\Plugins\Defaults',
        'custom' => 'App\Plugins\Custom',
    ],
];
