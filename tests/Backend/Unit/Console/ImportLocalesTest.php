<?php

namespace Tests\Backend\Unit\Console;

use App\Services\LocaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Storage;
use Tests\Backend\TestCase;

class ImportLocalesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test if locales are imported correctly
     */
    public function test_import_locales()
    {
        // Translation data for german (incomplete) in Poeditor
        $deLocale = [
            'home' => [
                'title' => 'Start',
                'description' => 'Das ist die Startseite',
            ],
        ];

        // Translation data for english in Poeditor
        $enLocale = [
            'home' => [
                'title' => 'Home',
                'description' => 'This is the home page',
            ],
            'app' => [
                'title' => 'My App',
                'description' => 'This is my app',
            ],
            'validation' => [
                'custom' => [
                    'attribute-name' => [
                        'rule-name' => 'custom-message',
                    ],
                ],
            ],
        ];

        // Fake process
        Process::fake();

        // Fake HTTP requests to poeditor api
        Http::fake([
            'api.poeditor.com/v2/languages/list' => Http::response(
                [
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'languages' => [
                            [
                                'name' => 'English',
                                'code' => 'en',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:59:02+0000',
                            ],
                            [
                                'name' => 'German',
                                'code' => 'de',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:58:40+0000',
                            ],
                        ],
                    ],
                ],
                200
            ),
            'api.poeditor.com/v2/projects/export' => Http::sequence()
                ->push([
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'url' => 'https://api.poeditor.com/v2/download/file/abc123',
                    ],
                ], 200)
                ->push([
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'url' => 'https://api.poeditor.com/v2/download/file/xyz123',
                    ],
                ], 200),
            'api.poeditor.com/v2/download/file/abc123' => Http::response($enLocale, 200),
            'api.poeditor.com/v2/download/file/xyz123' => Http::response($deLocale, 200),
        ]);

        // Create fake local disk for locales
        $localDisk = Storage::fake('local');
        Storage::shouldReceive('build')->with([
            'driver' => 'local',
            'root' => 'lang',
        ])->andReturn($localDisk);

        // Set config values
        config([
            'app.default_locales' => ['de', 'en'],
            'app.default_locale_dir' => 'lang',
            'services.poeditor.token' => 'token123',
            'services.poeditor.project' => 'project123',
        ]);

        // Call command and check output
        $this->artisan('locales:import')
            ->expectsOutput('Importing locales from POEditor')
            ->expectsOutput('Fetching languages list')
            ->expectsOutput('Found English (en)')
            ->expectsOutput('Fetching translation for en')
            ->expectsOutput('Downloading translation for en')
            ->expectsOutput('Found German (de)')
            ->expectsOutput('Fetching translation for de')
            ->expectsOutput('Downloading translation for de')
            ->expectsOutput('Apply coding standards');

        // Check if files are created based on the locale data loaded from the api
        $files = $localDisk->allFiles();
        $this->assertEquals(['de/home.php', 'en/app.php', 'en/home.php', 'en/validation.php'], $files);

        $localeService = $this->app->make(LocaleService::class);

        // Check if the locale data created with the new files is the same as the data loaded from the api
        $this->assertEquals($deLocale, json_decode($localeService->buildJsonLocale('de', false, false), true));
        $this->assertEquals($enLocale, json_decode($localeService->buildJsonLocale('en', false, false), true));

        Process::assertRan('composer run fix-cs lang');
    }

    /**
     * Test if locales are imported correctly
     */
    public function test_import_locales_failed_loading_list()
    {
        // Fake HTTP requests to poeditor api
        Http::fake([
            'api.poeditor.com/v2/languages/list' => Http::response(
                [
                    'response' => [
                        'status' => 'fail',
                        'code' => '4011',
                        'message' => 'Invalid API Token',
                    ],
                ],
                200
            ),
        ]);

        // Set config values
        config([
            'services.poeditor.token' => 'token123',
            'services.poeditor.project' => 'project123',
        ]);

        // Call command and check output
        $this->artisan('locales:import')
            ->expectsOutput('Importing locales from POEditor')
            ->expectsOutput('Fetching languages list')
            ->expectsOutput('Failed to fetch languages list')
            ->expectsOutput('Error code: 4011, message: Invalid API Token');
    }

    /**
     * Test if locales are imported correctly
     */
    public function test_import_locales_failed_fetching_locale()
    {
        // Fake HTTP requests to poeditor api
        Http::fake([
            'api.poeditor.com/v2/languages/list' => Http::response(
                [
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'languages' => [
                            [
                                'name' => 'English',
                                'code' => 'en',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:59:02+0000',
                            ],
                            [
                                'name' => 'German',
                                'code' => 'de',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:58:40+0000',
                            ],
                        ],
                    ],
                ],
                200
            ),
            'api.poeditor.com/v2/projects/export' => Http::sequence()
                ->push([
                    'response' => [
                        'status' => 'fail',
                        'code' => '4011',
                        'message' => 'Invalid API Token',
                    ],
                ], 200),
        ]);

        // Set config values
        config([
            'app.default_locales' => ['de', 'en'],
            'app.default_locale_dir' => 'lang',
            'services.poeditor.token' => 'token123',
            'services.poeditor.project' => 'project123',
        ]);

        // Call command and check output
        $this->artisan('locales:import')
            ->expectsOutput('Importing locales from POEditor')
            ->expectsOutput('Fetching languages list')
            ->expectsOutput('Found English (en)')
            ->expectsOutput('Failed to fetch translation for en')
            ->expectsOutput('Error code: 4011, message: Invalid API Token');
    }

    /**
     * Test if locales are imported correctly
     */
    public function test_import_locales_failed_download()
    {
        // Fake HTTP requests to poeditor api
        Http::fake([
            'api.poeditor.com/v2/languages/list' => Http::response(
                [
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'languages' => [
                            [
                                'name' => 'English',
                                'code' => 'en',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:59:02+0000',
                            ],
                            [
                                'name' => 'German',
                                'code' => 'de',
                                'translations' => 5,
                                'percentage' => 100,
                                'updated' => '2023-05-24T08:58:40+0000',
                            ],
                        ],
                    ],
                ],
                200
            ),
            'api.poeditor.com/v2/projects/export' => Http::sequence()
                ->push([
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'url' => 'https://api.poeditor.com/v2/download/file/abc123',
                    ],
                ], 200)
                ->push([
                    'response' => [
                        'status' => 'success',
                        'code' => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                        'url' => 'https://api.poeditor.com/v2/download/file/xyz123',
                    ],
                ], 200),
            'api.poeditor.com/v2/download/file/abc123' => Http::response(
                [
                    'response' => [
                        'status' => 'fail',
                        'code' => '4051',
                        'message' => 'Invalid download URL',
                    ]],
                200
            ),
        ]);

        // Create fake local disk for locales
        $localDisk = Storage::fake('local');
        Storage::shouldReceive('build')->with([
            'driver' => 'local',
            'root' => 'lang',
        ])->andReturn($localDisk);

        // Set config values
        config([
            'app.default_locales' => ['de', 'en'],
            'app.default_locale_dir' => 'lang',
            'services.poeditor.token' => 'token123',
            'services.poeditor.project' => 'project123',
        ]);

        // Call command and check output
        $this->artisan('locales:import')
            ->expectsOutput('Importing locales from POEditor')
            ->expectsOutput('Fetching languages list')
            ->expectsOutput('Found English (en)')
            ->expectsOutput('Fetching translation for en')
            ->expectsOutput('Downloading translation for en')
            ->expectsOutput('Failed to download translation for en')
            ->expectsOutput('Error code: 4051, message: Invalid download URL');
    }
}
