<?php

namespace Tests\Unit\Console;

use App\Services\LocaleService;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Client\Request;
use Tests\TestCase;

class UploadLocalesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test if locales are uploaded correctly
     */
    public function testLocaleUpload()
    {
        Http::fake([
            'api.poeditor.com/v2/projects/upload' => Http::sequence()
                ->push([
                    'response' => [
                        'status'  => 'success',
                        'code'    => '200',
                        'message' => 'OK',
                    ],
                    'result' => [
                      'terms' => [
                        'parsed'  => 1,
                        'added'   => 1,
                        'deleted' => 0
                      ],
                      'translations' => [
                        'parsed'  => 1,
                        'added'   => 1,
                        'updated' => 0
                      ]
                    ]
                  ], 200)
                  ->push([
                    'response' => [
                      'status'  => 'fail',
                      'code'    => '4048',
                      'message' => 'Too many upload requests in a short period of time'
                    ]
                  ], 200),

        ]);

        config([
            'app.default_locales'            => ['de','en'],
            'services.poeditor.token'        => 'token123',
            'services.poeditor.project'      => 'project123',
            'services.poeditor.upload_delay' => 0,
        ]);

        $mock = $this
            ->mock(LocaleService::class);
        
        $mock->shouldReceive('buildJsonLocale')
        ->once()
        ->with('de', false, false)
        ->andReturn('{"key_1":"wert_1"}');

        $mock->shouldReceive('buildJsonLocale')
        ->once()
        ->with('en', false, false)
        ->andReturn('{"key_1":"value_1"}');

        $this->artisan('locales:upload')
        ->expectsOutput('Processing locale de')
        ->expectsOutput('Waiting 0 seconds before upload')
        ->expectsOutput('Uploading locale de')
        ->expectsOutput('Locale de uploaded successfully')
        ->expectsOutput('Processing locale en')
        ->expectsOutput('Waiting 0 seconds before upload')
        ->expectsOutput('Uploading locale en')
        ->expectsOutput('Error uploading locale en')
        ->expectsOutput('Error code: 4048, message: Too many upload requests in a short period of time');

        Http::assertSent(function (Request $request) {
            $data = [];
            foreach ($request->data() as $entry) {
                $data[$entry['name']] = $entry['contents'];
            }

            return $request->url() == 'https://api.poeditor.com/v2/projects/upload' &&
                    $data['api_token'] == 'token123' &&
                    $data['id'] == 'project123' &&
                     $data['updating'] == 'terms_translations' &&
                     $data['overwrite'] == 1 &&
                     $data['sync_terms'] == 0 &&
                     $data['fuzzy_trigger'] == 1 &&
                     $data['language'] == 'de' &&
                     $data['file'] == '{"key_1":"wert_1"}';
        });

        Http::assertSent(function (Request $request) {
            $data = [];
            foreach ($request->data() as $entry) {
                $data[$entry['name']] = $entry['contents'];
            }

            return $request->url() == 'https://api.poeditor.com/v2/projects/upload' &&
                    $data['api_token'] == 'token123' &&
                    $data['id'] == 'project123' &&
                     $data['updating'] == 'terms_translations' &&
                     $data['overwrite'] == 1 &&
                     $data['sync_terms'] == 1 &&
                     $data['fuzzy_trigger'] == 1 &&
                     $data['language'] == 'en' &&
                     $data['file'] == '{"key_1":"value_1"}';
        });
    }
}
