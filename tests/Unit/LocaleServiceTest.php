<?php

namespace Tests\Unit;

use App\Services\LocaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Cache;
use Mockery\MockInterface;
use Tests\TestCase;

class LocaleServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testBuildCache()
    {
        config([
            'app.enabled_locales'   => ['de', 'en'],
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

    public function testJsonLocale()
    {
        config([
            'app.enabled_locales'   => ['de', 'en'],
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

    public function testBuildJson()
    {
        config([
            'app.default_locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.custom_locale_dir'         => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, false);

        $this->assertEquals('{"app":{"key_1":"value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"value_4_1","key_4_2":{"key_4_2_1":"value_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function testBuildJsonWithCustom()
    {
        config([
            'app.default_locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.custom_locale_dir'         => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, true);

        $this->assertEquals('{"app":{"key_1":"new_value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"value_4_1","key_4_2":{"key_4_2_1":"value_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function testBuildJsonWithFallback()
    {
        config([
            'app.default_locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.custom_locale_dir'         => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, false);

        $this->assertEquals('{"app":{"key_1":"valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"valeur_4_1","key_4_2":{"key_4_2_1":"valeur_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }

    public function testBuildJsonWithFallbackAndCustom()
    {
        config([
            'app.default_locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.custom_locale_dir'         => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, true);

        $this->assertEquals('{"app":{"key_1":"nouvelle_valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"valeur_4_1","key_4_2":{"key_4_2_1":"valeur_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $response);
    }
}
