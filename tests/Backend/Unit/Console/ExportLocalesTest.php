<?php

namespace Tests\Backend\Unit\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Storage;
use Tests\Backend\TestCase;

class ExportLocalesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test if locales are exported to the fixtures directory for eslint
     */
    public function test_export_locales()
    {
        // Create fake local disk for output
        $fixturesDisk = Storage::fake('local');

        // Create real disk for loading of the locale fixtures
        $localeDisk = Storage::build([
            'driver' => 'local',
            'root' => 'tests/Backend/Fixtures/Locales/default',
        ]);

        Storage::shouldReceive('build')->with([
            'driver' => 'local',
            'root' => 'lang',
        ])->andReturn($localeDisk);

        Storage::shouldReceive('build')->with([
            'driver' => 'local',
            'root' => 'tests/Backend/Fixtures/Locales',
        ])->andReturn($fixturesDisk);

        // Set config values
        config([
            'app.default_locales' => ['en' => ['name' => 'English', 'dateTimeFormat' => []], 'fr' => ['name' => 'Français', 'dateTimeFormat' => []]],
            'app.default_locale_dir' => 'lang',
        ]);

        // Call command and check output
        $this->artisan('locales:export');

        // Check if files are created based on the locale data loaded from the api
        $files = $fixturesDisk->allFiles();
        $this->assertEquals(['en.json', 'fr.json'], $files);

        // Check if the contents of the files are correct
        $this->assertEquals('{"app":{"key_1":"value_1","key_2":"value_2","key_3":{"key_3_1":"value_3_1","key_3_2":{"key_3_2_1":"value_3_2_1"}},"key_4":{"key_4_1":"value_4_1","key_4_2":{"key_4_2_1":"value_4_2_1","key_4_2_2":"value_4_2_2"}}}}', $fixturesDisk->get('en.json'));
        $this->assertEquals('{"app":{"key_1":"valeur_1","key_4":{"key_4_1":"valeur_4_1","key_4_2":{"key_4_2_1":"valeur_4_2_1"}}}}', $fixturesDisk->get('fr.json'));
    }
}
