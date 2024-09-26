<?php

return [
    'enabled' => explode(',', env('PLUGINS', '')),
    'contracts' => [
        \App\Plugins\Contracts\ServerLoadCalculationPluginContract::class,
    ],
    'namespaces' => [
        'defaults' => 'App\Plugins\Defaults',
        'custom' => 'App\Plugins\Custom',
    ],
];
