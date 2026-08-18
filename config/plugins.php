<?php

declare(strict_types=1);

use App\Plugins\Contracts\ServerLoadCalculationPluginContract;

return [
    'enabled' => explode(',', env('PLUGINS', '')),
    'contracts' => [
        ServerLoadCalculationPluginContract::class,
    ],
    'namespaces' => [
        'defaults' => 'App\Plugins\Defaults',
        'custom' => 'App\Plugins\Custom',
    ],
];
