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

    public function testBuildJson()
    {
        config([
            'app.locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.locale_custom_dir' => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, false);

        $this->assertEquals('{"app":{"key_1":"value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}}}}', $response);
    }

    public function testBuildJsonWithCustom()
    {
        config([
            'app.locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.locale_custom_dir' => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('en', false, true);

        $this->assertEquals('{"app":{"key_1":"new_value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}}}}', $response);
    }

    public function testBuildJsonWithFallback()
    {
        config([
            'app.locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.locale_custom_dir' => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, false);

        $this->assertEquals('{"app":{"key_1":"valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}}}}', $response);
    }

    public function testBuildJsonWithFallbackAndCustom()
    {
        config([
            'app.locale_dir'        => base_path('tests/Fixtures/Locales/default'),
            'app.locale_custom_dir' => base_path('tests/Fixtures/Locales/custom'),
        ]);

        $localeService = $this->app->make(LocaleService::class);

        $response = $localeService->buildJsonLocale('fr', true, true);

        $this->assertEquals('{"app":{"key_1":"nouvelle_valeur_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}}}}', $response);
    }
}
