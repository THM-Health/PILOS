<?php

namespace Tests\Backend;

use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\StreamingSettings;
use App\Settings\ThemeSettings;
use App\Settings\UserSettings;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use LdapRecord\Laravel\Testing\DirectoryEmulator;

abstract class TestCase extends BaseTestCase
{
    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    public GeneralSettings $generalSettings;

    public ThemeSettings $themeSettings;

    public BannerSettings $bannerSettings;

    public RoomSettings $roomSettings;

    public UserSettings $userSettings;

    public RecordingSettings $recordingSettings;

    public BigBlueButtonSettings $bigBlueButtonSettings;

    public StreamingSettings $streamingSettings;

    protected function setUp(): void
    {
        if (! defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }

        parent::setUp();

        $this->initSettings();

        $this->withoutVite();
    }

    protected function initSettings()
    {
        $this->generalSettings = app(GeneralSettings::class);
        $this->themeSettings = app(ThemeSettings::class);
        $this->bannerSettings = app(BannerSettings::class);
        $this->roomSettings = app(RoomSettings::class);
        $this->userSettings = app(UserSettings::class);
        $this->recordingSettings = app(RecordingSettings::class);
        $this->bigBlueButtonSettings = app(BigBlueButtonSettings::class);
        $this->streamingSettings = app(StreamingSettings::class);
    }

    protected function tearDown(): void
    {
        DirectoryEmulator::teardown();

        parent::tearDown();
    }
}
