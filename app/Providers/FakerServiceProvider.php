<?php

namespace App\Providers;

use App\Faker\TextProvider;
use Faker\Factory;
use Illuminate\Support\ServiceProvider;

class FakerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    #[\Override]
    public function register(): void
    {
        $this->app->singleton(function (): \Faker\Generator {
            $faker = Factory::create();
            $faker->addProvider(new TextProvider($faker));

            return $faker;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
