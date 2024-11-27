<?php

namespace Backend\Feature\api\v1;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class ApplicationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /**
     * Tests that the correct config settings are provided
     *
     * @return void
     */
    public function test_config()
    {
        $this->generalSettings->pagination_page_size = 123;
        $this->generalSettings->help_url = 'http://localhost';
        $this->generalSettings->legal_notice_url = 'http://localhost';
        $this->generalSettings->privacy_policy_url = 'http://localhost';
        $this->generalSettings->toast_lifetime = 10;
        $this->generalSettings->no_welcome_page = false;
        $this->generalSettings->save();

        $this->themeSettings->logo = 'testlogo.svg';
        $this->themeSettings->logo_dark = 'testlogo-dark.svg';
        $this->themeSettings->favicon = 'testfavicon.ico';
        $this->themeSettings->favicon_dark = 'testfavicon-dark.ico';
        $this->themeSettings->primary_color = '#4a5c66';
        $this->themeSettings->rounded = true;
        $this->themeSettings->save();

        $this->bannerSettings->enabled = true;
        $this->bannerSettings->message = 'Welcome to Test!';
        $this->bannerSettings->title = 'Welcome';
        $this->bannerSettings->color = '#fff';
        $this->bannerSettings->background = '#4a5c66';
        $this->bannerSettings->link = 'http://localhost';
        $this->bannerSettings->icon = 'fas fa-door-open';
        $this->bannerSettings->link_text = 'More';
        $this->bannerSettings->link_style = LinkButtonStyle::PRIMARY;
        $this->bannerSettings->link_target = LinkTarget::BLANK;
        $this->bannerSettings->save();

        $this->roomSettings->limit = -1;
        $this->roomSettings->token_expiration = TimePeriod::UNLIMITED;
        $this->roomSettings->save();

        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->meeting_usage_retention_period = TimePeriod::THREE_MONTHS;
        $this->recordingSettings->attendance_retention_period = TimePeriod::TWO_WEEKS;
        $this->recordingSettings->recording_retention_period = TimePeriod::ONE_MONTH;
        $this->recordingSettings->save();

        config(['app.url' => 'https://domain.tld']);
        config(['app.version' => 'v1.0.0']);
        config(['app.whitelabel' => false]);
        config(['auth.local.enabled' => true]);
        config(['ldap.enabled' => false]);
        config(['services.shibboleth.enabled' => false]);
        config(['recording.max_retention_period' => -1]);
        config(['recording.description_limit' => 255]);
        config(['bigbluebutton.room_refresh_rate' => 20]);
        config(['bigbluebutton.allowed_file_mimes' => 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png']);
        config(['bigbluebutton.max_filesize' => 30]);
        config(['bigbluebutton.room_name_limit' => 50]);
        config(['bigbluebutton.welcome_message_limit' => 500]);

        $this->getJson(route('api.v1.config'))
            ->assertJson([
                'data' => [
                    'general' => [
                        'version' => 'v1.0.0',
                        'whitelabel' => false,
                        'base_url' => 'https://domain.tld',
                        'pagination_page_size' => 123,
                        'toast_lifetime' => 10,
                        'help_url' => 'http://localhost',
                        'legal_notice_url' => 'http://localhost',
                        'privacy_policy_url' => 'http://localhost',
                        'no_welcome_page' => false,
                    ],
                    'theme' => [
                        'logo' => 'testlogo.svg',
                        'logo_dark' => 'testlogo-dark.svg',
                        'favicon' => 'testfavicon.ico',
                        'favicon_dark' => 'testfavicon-dark.ico',
                        'primary_color' => '#4a5c66',
                        'rounded' => true,
                    ],
                    'room' => [
                        'file_terms_of_use' => null,
                        'limit' => -1,
                        'token_expiration' => -1,
                        'refresh_rate' => 20,
                    ],
                    'banner' => [
                        'enabled' => true,
                        'message' => 'Welcome to Test!',
                        'title' => 'Welcome',
                        'color' => '#fff',
                        'background' => '#4a5c66',
                        'link' => 'http://localhost',
                        'icon' => 'fas fa-door-open',
                        'link_text' => 'More',
                        'link_style' => 'primary',
                        'link_target' => 'blank',
                    ],
                    'recording' => [
                        'meeting_usage_enabled' => true,
                        'meeting_usage_retention_period' => 90,
                        'attendance_retention_period' => 14,
                        'recording_retention_period' => 30,
                        'recording_description_limit' => 255,
                    ],
                    'auth' => [
                        'local' => true,
                        'ldap' => false,
                        'shibboleth' => false,
                    ],
                    'bbb' => [
                        'file_mimes' => 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,odp,odg,odc,odi,jpg,jpeg,png',
                        'max_filesize' => 30,
                        'room_name_limit' => 50,
                        'welcome_message_limit' => 500,
                    ],
                ],
            ])
            ->assertSuccessful();

        $this->generalSettings->help_url = null;
        $this->generalSettings->legal_notice_url = null;
        $this->generalSettings->privacy_policy_url = null;
        $this->generalSettings->no_welcome_page = true;
        $this->generalSettings->save();

        $this->bannerSettings->enabled = false;
        $this->bannerSettings->save();

        $this->roomSettings->token_expiration = TimePeriod::THREE_MONTHS;
        $this->roomSettings->file_terms_of_use = 'Test';
        $this->roomSettings->save();

        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->save();

        config(['app.version' => null]);
        config(['app.whitelabel' => true]);
        config(['bigbluebutton.room_refresh_rate' => 5]);
        config(['auth.local.enabled' => false]);
        config(['ldap.enabled' => true]);

        $this->getJson(route('api.v1.config'))
            ->assertJson([
                'data' => [
                    'general' => [
                        'version' => null,
                        'whitelabel' => true,
                        'base_url' => 'https://domain.tld',
                        'pagination_page_size' => 123,
                        'toast_lifetime' => 10,
                        'help_url' => null,
                        'legal_notice_url' => null,
                        'privacy_policy_url' => null,
                        'no_welcome_page' => true,
                    ],
                    'theme' => [
                        'logo' => 'testlogo.svg',
                        'logo_dark' => 'testlogo-dark.svg',
                        'favicon' => 'testfavicon.ico',
                        'favicon_dark' => 'testfavicon-dark.ico',
                        'primary_color' => '#4a5c66',
                        'rounded' => true,
                    ],
                    'room' => [
                        'file_terms_of_use' => 'Test',
                        'limit' => -1,
                        'token_expiration' => 90,
                        'refresh_rate' => 5,
                    ],
                    'banner' => [
                        'enabled' => false,
                    ],
                    'recording' => [
                        'meeting_usage_enabled' => false,
                        'meeting_usage_retention_period' => 90,
                        'attendance_retention_period' => 14,
                    ],
                    'auth' => [
                        'local' => false,
                        'ldap' => true,
                    ],
                ],
            ])
            ->assertSuccessful();
    }
}
