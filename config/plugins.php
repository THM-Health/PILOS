<?php

return [
    'enabled' => explode(',', (string) env('PLUGINS', '')),
    'contracts' => [
        \App\Plugins\Contracts\ServerLoadCalculationPluginContract::class,
    ],
    'namespaces' => [
        'defaults' => 'App\Plugins\Defaults',
        'custom' => 'App\Plugins\Custom',
    ],
];
