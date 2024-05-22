<?php

return [
    'enabled' => explode(',', env('PLUGINS', '')),
    'contracts' => [
        \App\Plugins\Contracts\ServerLoadCalculationPluginContract::class,
        \App\Plugins\Contracts\CreateMeetingPluginContract::class,
        \App\Plugins\Contracts\JoinMeetingPluginContract::class,
    ],
    'namespaces' => [
        'defaults' => 'App\Plugins\Defaults',
        'custom' => 'App\Plugins\Custom',
    ],
];
