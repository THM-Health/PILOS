<?php

namespace App\Plugins;

use App\Plugins\Defaults\ServerLoadCalculationPlugin;
use Illuminate\Support\ServiceProvider;
use ReflectionClass;

class PluginServiceProvider extends ServiceProvider
{
    protected array $plugins = [
        ServerLoadCalculationPlugin::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        foreach ($this->plugins as $plugin) {
            $reflect = new ReflectionClass($plugin);

            $className = $reflect->getShortName();
            $contract = "App\Plugins\Contracts\\{$className}Contract";
            $custom = "App\Plugins\Custom\\{$className}";

            if (class_exists($custom)) {
                $this->app->bind($contract, $custom);
            } else {
                $this->app->bind($contract, $plugin);
            }
        }
    }
}
