<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Plugins;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use ReflectionClass;

class PluginServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $contracts = config('plugins.contracts');

        foreach ($contracts as $contract) {

            $this->app->bind($contract, function (Application $app) use ($contract) {
                $reflect = new ReflectionClass($contract);
                $contractName = $reflect->getShortName();

                $pluginName = preg_replace('/Contract$/', '', $contractName);

                $enabledPlugins = config('plugins.enabled');
                $namespace = in_array($pluginName, $enabledPlugins) ? config('plugins.namespaces.custom') : config('plugins.namespaces.defaults');

                $pluginClass = "{$namespace}\\{$pluginName}";

                return new $pluginClass;
            });
        }
    }
}
