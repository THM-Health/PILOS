<?php

namespace App\Providers;

use Illuminate\Translation\FileLoader;
use Illuminate\Translation\TranslationServiceProvider as BaseTranslationServiceProvider;

class TranslationServiceProvider extends BaseTranslationServiceProvider
{
    /**
     * Register the translation line loader.
     *
     * @return void
     */
    #[\Override]
    protected function registerLoader()
    {
        $this->app->singleton('translation.loader', fn ($app) => new FileLoader($app['files'], [config('app.default_locale_dir'), config('app.custom_locale_dir')]));
    }
}
