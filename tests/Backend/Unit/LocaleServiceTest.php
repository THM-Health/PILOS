<?php

namespace Tests\Backend\Unit;

use App\Services\LocaleService;
use Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Mockery\MockInterface;
use Tests\Backend\TestCase;

class LocaleServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_build_cache()
    {
        config([
            'app.enabled_locales' => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []]],
        ]);

        $mock = $this->partialMock(LocaleService::class, function (MockInterface $mock) {
            $mock->shouldReceive('buildJsonLocale')
                ->once()
                ->with('de')
                ->andReturn("{ 'key1': 'value1' }");

            $mock->shouldReceive('buildJsonLocale')
                ->once()
                ->with('en')
                ->andReturn("{ 'key2': 'value2' }");
        });

        $this->instance(
            LocaleService::class,
            $mock
        );

        Cache::shouldReceive('forever')
            ->once()
            ->with('locale-de', "{ 'key1': 'value1' }");

        Cache::shouldReceive('forever')
            ->once()
            ->with('locale-en', "{ 'key2': 'value2' }");

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildCache();

        $this->assertEquals(['de', 'en'], $response);
    }

    public function test_json_locale()
    {
        config([
            'app.enabled_locales' => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []]],
        ]);

        // Mock the result of building the locale for the german locale
        $mock = $this->partialMock(LocaleService::class, function (MockInterface $mock) {
            $mock->shouldReceive('buildJsonLocale')
                ->once()
                ->with('de')
                ->andReturn("{ 'key1': 'wert_1' }");
        });

        $this->instance(
            LocaleService::class,
            $mock
        );

        // No change for german locale
        Cache::shouldReceive('has')
            ->once()
            ->with('locale-de')
            ->andReturn(false);

        // Existing cache for english locale
        Cache::shouldReceive('has')
            ->once()
            ->with('locale-en')
            ->andReturn(true);

        Cache::shouldReceive('get')
            ->once()
            ->with('locale-en')
            ->andReturn("{ 'key1': 'value_1' }");

        $localeService = $this->app->make(LocaleService::class);

        // Test without cache
        $response = $localeService->getJsonLocale('de');
        $this->assertEquals("{ 'key1': 'wert_1' }", $response);

        // Test with cache
        $response = $localeService->getJsonLocale('en');
        $this->assertEquals("{ 'key1': 'value_1' }", $response);
    }

    public function test_build_json()
    {
        config([
            'app.default_locale_dir' => base_path('tests/Backend/Fixtures/Locales/default'),
            'app.custom_locale_dir' => base_path('tests/Backend/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, false);

        $this->assertEquals('{"app":{"key_1":"value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"value_4_1","key_4_2":{"key_4_2_1":"value_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function test_build_json_with_custom()
    {
        config([
            'app.default_locale_dir' => base_path('tests/Backend/Fixtures/Locales/default'),
            'app.custom_locale_dir' => base_path('tests/Backend/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, true);

        $this->assertEquals('{"app":{"key_1":"new_value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"value_4_1","key_4_2":{"key_4_2_1":"value_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function test_build_json_with_fallback()
    {
        config([
            'app.default_locale_dir' => base_path('tests/Backend/Fixtures/Locales/default'),
            'app.custom_locale_dir' => base_path('tests/Backend/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, false);

        $this->assertEquals('{"app":{"key_1":"valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"valeur_4_1","key_4_2":{"key_4_2_1":"valeur_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function test_build_json_with_fallback_and_custom()
    {
        config([
            'app.default_locale_dir' => base_path('tests/Backend/Fixtures/Locales/default'),
            'app.custom_locale_dir' => base_path('tests/Backend/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, true);

        $this->assertEquals('{"app":{"key_1":"nouvelle_valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"valeur_4_1","key_4_2":{"key_4_2_1":"valeur_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function test_get_locales_from_config_files()
    {
        // Check if application default locales with a metadata file are loaded correctly
        $defaultLocales = LocaleService::getLocalesFromConfigFiles(base_path('tests/Backend/Fixtures/Locales/default'));
        $this->assertEquals(['en', 'fr'], array_keys($defaultLocales));
        $this->assertEquals('English', $defaultLocales['en']['name']);
        $this->assertEquals('Français', $defaultLocales['fr']['name']);

        // Check if custom locales with a metadata file are loaded correctly
        $customLocales = LocaleService::getLocalesFromConfigFiles(base_path('tests/Backend/Fixtures/Locales/custom'));
        $this->assertEquals(['de', 'en'], array_keys($customLocales));
        $this->assertEquals('Deutsch', $customLocales['de']['name']);
        $this->assertEquals('English (US)', $customLocales['en']['name']);
    }

    public function test_get_enabled_locales()
    {
        // List of application default locales
        $defaultLocales = [
            'en' => ['name' => 'English', 'dateTimeFormat' => []],
            'fr' => ['name' => 'Français', 'dateTimeFormat' => []],
        ];

        // List of custom locales
        $customLocales = [
            'de' => ['name' => 'Deutsch', 'dateTimeFormat' => []],
            'en' => ['name' => 'English (US)', 'dateTimeFormat' => []],
            'es' => ['dateTimeFormat' => []],
        ];

        // List of locales that should be enabled without a whitelist
        $enabledLocales = LocaleService::getEnabledLocales($defaultLocales, $customLocales, null);

        // Check if all locales are enabled, locales without a name are filtered out
        $this->assertEquals(['en', 'fr', 'de'], array_keys($enabledLocales));

        // Check if custom locale metadata overwrites default locale metadata
        $this->assertEquals('English (US)', $enabledLocales['en']['name']);

        // Check metadata for new custom locale
        $this->assertEquals('Deutsch', $enabledLocales['de']['name']);

        // Whitelist
        $whitelist = ['en', 'fr'];

        // List of locales that should be enabled with a whitelist
        $enabledLocales = LocaleService::getEnabledLocales($defaultLocales, $customLocales, $whitelist);

        // Check if only whitelisted locales are enabled
        $this->assertEquals(['en', 'fr'], array_keys($enabledLocales));
    }
}
