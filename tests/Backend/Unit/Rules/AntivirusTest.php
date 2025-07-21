<?php

namespace Tests\Backend\Unit\Rules;

use App\Rules\Antivirus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class AntivirusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Log::swap(new LogFake);
    }

    public function test_validation_skipped_if_disabled()
    {
        Config::set('antivirus.enabled', false);
        Config::set('antivirus.clamav.url', 'http://clamav');

        Http::fake();

        $rule = new Antivirus;

        $failCalled = false;
        $rule->validate('file', UploadedFile::fake()->create('test.txt'), function () use (&$failCalled) {
            $failCalled = true;
        });

        $this->assertFalse($failCalled);

        Http::assertNothingSent();
    }

    public function test_validation_passes_for_clean_file()
    {
        Config::set('antivirus.enabled', true);
        Config::set('antivirus.clamav.url', 'http://clamav');
        $file = UploadedFile::fake()->create('clean.txt');
        Http::fake([
            'http://clamav' => Http::response([], 200),
        ]);
        $rule = new Antivirus;

        $failCalled = false;
        $rule->validate('file', $file, function () use (&$failCalled) {
            $failCalled = true;
        });

        $this->assertFalse($failCalled);

        Http::assertSent(function (Request $request) {
            $data = $request->data()[0];

            return $request->method() === 'POST' && $request->isMultipart() && $data['name'] === 'file'
                && $data['filename'] === 'clean.txt';

        });
    }

    public function test_validation_fails_for_infected_file()
    {
        Config::set('antivirus.enabled', true);
        Config::set('antivirus.clamav.url', 'http://clamav');
        $file = UploadedFile::fake()->create('virus.txt');
        Http::fake([
            'http://clamav' => Http::response([
                ['Description' => 'Eicar-Test-Signature'],
            ], 406),
        ]);
        $rule = new Antivirus;

        $failCalled = false;
        $rule->validate('file', $file, function ($message) use (&$failCalled) {
            $failCalled = true;
            $this->assertEquals(__('validation.antivirus.virus', ['file' => 'virus.txt']), $message);
        });

        $this->assertTrue($failCalled);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'warning'
                && $log->message == 'Virus {virus_description} detected'
                && $log->context['virus_description'] == 'Eicar-Test-Signature'
                && $log->context['file_name'] === 'virus.txt'
                && $log->context['file_path'] === $file->path()
                && $log->context['request_url'] === url()->current()
        );
    }

    public function test_validation_fails_for_clamav_error()
    {
        Config::set('antivirus.enabled', true);
        Config::set('antivirus.clamav.url', 'http://clamav');
        $file = UploadedFile::fake()->create('virus.txt');
        Http::fake([
            'http://clamav' => Http::response([], 500),
        ]);
        $rule = new Antivirus;

        $failCalled = false;
        $rule->validate('file', $file, function ($message) use (&$failCalled) {
            $failCalled = true;
            $this->assertEquals(__('validation.antivirus.error', ['file' => 'virus.txt']), $message);
        });

        $this->assertTrue($failCalled);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'error'
                && $log->message == 'Virus scan failed'
                && $log->context['status'] == '500'
        );
    }

    public function test_validation_fails_on_exception()
    {
        Config::set('antivirus.enabled', true);
        Config::set('antivirus.clamav.url', 'http://clamav');
        $file = UploadedFile::fake()->create('virus.txt');
        Http::fake([
            'http://clamav' => Http::failedConnection('timeout'),
        ]);
        $rule = new Antivirus;

        $failCalled = false;
        $rule->validate('file', $file, function ($message) use (&$failCalled) {
            $failCalled = true;
            $this->assertEquals(__('validation.antivirus.error', ['file' => 'virus.txt']), $message);
        });

        $this->assertTrue($failCalled);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'error'
                && $log->message == 'Virus scan failed'
                && $log->context['exception'] == 'timeout'
        );
    }
}
