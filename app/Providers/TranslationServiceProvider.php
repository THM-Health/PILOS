<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Contracts\Translation\Translator;
use Illuminate\Translation\FileLoader;
use Illuminate\Translation\TranslationServiceProvider as BaseTranslationServiceProvider;

class TranslationServiceProvider extends BaseTranslationServiceProvider
{
    public function register()
    {
        parent::register();
        $this->app->make(Translator::class)->handleMissingKeysUsing(function ($key, $replace, $locale, $fallback) {
            return match ($key) {
                '(and :count more error)' => __('validation.one_more_error'),
                '(and :count more errors)' => __('validation.several_errors'),
                default => $key,
            };
        });
    }

    /**
     * Register the translation line loader.
     *
     * @return void
     */
    protected function registerLoader()
    {
        $this->app->singleton('translation.loader', function ($app) {
            return new FileLoader($app['files'], [config('app.default_locale_dir'), config('app.custom_locale_dir')]);
        });
    }
}
