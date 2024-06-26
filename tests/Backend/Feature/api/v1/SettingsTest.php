<?php

namespace Tests\Backend\Feature\api\v1;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Backend\TestCase;

class SettingsTest extends TestCase
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
     * Tests that the correct application wide settings provided
     *
     * @return void
     */
    public function testApplicationSettings()
    {
        $this->generalSettings->logo = 'testlogo.svg';
        $this->generalSettings->pagination_page_size = 123;
        $this->generalSettings->help_url = 'http://localhost';
        $this->generalSettings->legal_notice_url = 'http://localhost';
        $this->generalSettings->privacy_policy_url = 'http://localhost';
        $this->generalSettings->toast_lifetime = 10;
        $this->generalSettings->save();

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
        $this->roomSettings->pagination_page_size = 123;
        $this->roomSettings->token_expiration = TimePeriod::UNLIMITED;
        $this->roomSettings->save();

        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->meeting_usage_retention_period = TimePeriod::THREE_MONTHS;
        $this->recordingSettings->attendance_retention_period = TimePeriod::TWO_WEEKS;
        $this->recordingSettings->recording_retention_period = TimePeriod::ONE_MONTH;
        $this->recordingSettings->save();

        config(['bigbluebutton.room_refresh_rate' => 20]);
        config(['app.url' => 'https://domain.tld']);
        config(['app.version' => 'v1.0.0']);
        config(['app.whitelabel' => false]);
        config(['auth.local.enabled' => true]);
        config(['ldap.enabled' => false]);
        config(['recording.max_retention_period' => -1]);

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'version' => 'v1.0.0',
                    'whitelabel' => false,
                    'base_url' => 'https://domain.tld',
                    'logo' => 'testlogo.svg',
                    'pagination_page_size' => 123,
                    'room_pagination_page_size' => 123,
                    'toast_lifetime' => 10,
                    'room_limit' => -1,
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
                    'help_url' => 'http://localhost',
                    'legal_notice_url' => 'http://localhost',
                    'privacy_policy_url' => 'http://localhost',
                    'statistics' => [
                        'meetings' => [
                            'enabled' => true,
                            'retention_period' => 90,
                        ],
                    ],
                    'attendance' => [
                        'retention_period' => 14,
                    ],
                    'recording' => [
                        'retention_period' => 30,
                        'max_retention_period' => -1,
                    ],
                    'room_token_expiration' => -1,
                    'room_refresh_rate' => 20,
                    'auth' => [
                        'local' => true,
                        'ldap' => false,
                    ],
                ],
            ])
            ->assertSuccessful();

        $this->generalSettings->help_url = null;
        $this->generalSettings->legal_notice_url = null;
        $this->generalSettings->privacy_policy_url = null;
        $this->generalSettings->save();

        $this->bannerSettings->enabled = false;
        $this->bannerSettings->save();

        $this->roomSettings->token_expiration = TimePeriod::THREE_MONTHS;
        $this->roomSettings->save();

        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->save();

        config(['app.version' => null]);
        config(['app.whitelabel' => true]);
        config(['bigbluebutton.room_refresh_rate' => 5]);
        config(['auth.local.enabled' => false]);
        config(['ldap.enabled' => true]);

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'version' => null,
                    'whitelabel' => true,
                    'logo' => 'testlogo.svg',
                    'pagination_page_size' => 123,
                    'room_pagination_page_size' => 123,
                    'room_limit' => -1,
                    'banner' => [
                        'enabled' => false,
                    ],
                    'help_url' => null,
                    'legal_notice_url' => null,
                    'privacy_policy_url' => null,
                    'statistics' => [
                        'meetings' => [
                            'enabled' => false,
                            'retention_period' => 90,
                        ],
                    ],
                    'attendance' => [
                        'retention_period' => 14,
                    ],
                    'room_token_expiration' => 90,
                    'room_refresh_rate' => 5,
                    'auth' => [
                        'local' => false,
                        'ldap' => true,
                    ],
                ],
            ])
            ->assertSuccessful();
    }

    /**
     * Tests that the correct application wide settings provided
     * when listing all settings for edition.
     *
     * @return void
     */
    public function testAllApplicationSettings()
    {
        $this->generalSettings->logo = 'testlogo.svg';
        $this->generalSettings->pagination_page_size = 123;
        $this->generalSettings->save();

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

        $this->roomSettings->pagination_page_size = 123;
        $this->roomSettings->limit = -1;
        $this->roomSettings->auto_delete_inactive_period = TimePeriod::ONE_WEEK;
        $this->roomSettings->auto_delete_never_used_period = TimePeriod::TWO_WEEKS;
        $this->roomSettings->auto_delete_deadline_period = TimePeriod::ONE_MONTH;
        $this->roomSettings->save();

        $this->recordingSettings->server_usage_enabled = true;
        $this->recordingSettings->server_usage_retention_period = TimePeriod::ONE_WEEK;
        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->meeting_usage_retention_period = TimePeriod::THREE_MONTHS;
        $this->recordingSettings->attendance_retention_period = TimePeriod::TWO_WEEKS;
        $this->recordingSettings->recording_retention_period = TimePeriod::ONE_MONTH;
        $this->recordingSettings->save();

        $this->bigBlueButtonSettings->style = url('style.css');
        $this->bigBlueButtonSettings->logo = url('logo.png');
        $this->bigBlueButtonSettings->save();

        config(['bigbluebutton.allowed_file_mimes' => 'pdf,doc,docx,xls']);
        config(['bigbluebutton.max_filesize' => 10]);
        config(['bigbluebutton.room_name_limit' => 20]);
        config(['bigbluebutton.welcome_message_limit' => 100]);
        config(['app.url' => 'https://domain.tld']);
        config(['bigbluebutton.room_refresh_rate' => 20]);
        config(['recording.max_retention_period' => 90]);

        $this->getJson(route('api.v1.application.complete'))->assertUnauthorized();
        $this->actingAs($this->user)->getJson(route('api.v1.application.complete'))->assertForbidden();

        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->getJson(route('api.v1.application.complete'))
            ->assertJson([
                'data' => [
                    'base_url' => 'https://domain.tld',
                    'logo' => 'testlogo.svg',
                    'pagination_page_size' => 123,
                    'room_pagination_page_size' => 123,
                    'room_limit' => -1,
                    'room_refresh_rate' => 20,
                    'banner' => [
                        'enabled' => true,
                        'message' => 'Welcome to Test!',
                        'title' => 'Welcome',
                        'color' => '#fff',
                        'background' => '#4a5c66',
                        'link' => 'http://localhost',
                        'icon' => 'fas fa-door-open',
                    ],
                    'bbb' => [
                        'file_mimes' => 'pdf,doc,docx,xls',
                        'max_filesize' => 10,
                        'room_name_limit' => 20,
                        'welcome_message_limit' => 100,
                        'style' => url('style.css'),
                        'logo' => url('logo.png'),
                    ],
                    'statistics' => [
                        'servers' => [
                            'enabled' => true,
                            'retention_period' => 7,
                        ],
                        'meetings' => [
                            'enabled' => false,
                            'retention_period' => 90,
                        ],
                    ],
                    'attendance' => [
                        'retention_period' => 14,
                    ],
                    'recording' => [
                        'retention_period' => 30,
                        'max_retention_period' => 90,
                    ],
                    'room_auto_delete' => [
                        'inactive_period' => 7,
                        'never_used_period' => 14,
                        'deadline_period' => 30,
                    ],
                ],
            ])
            ->assertSuccessful();

        $this->bannerSettings->enabled = false;
        $this->bannerSettings->save();

        $this->recordingSettings->server_usage_enabled = false;
        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->save();

        $this->roomSettings->auto_delete_inactive_period = TimePeriod::TWO_WEEKS;
        $this->roomSettings->auto_delete_never_used_period = TimePeriod::ONE_WEEK;
        $this->roomSettings->auto_delete_deadline_period = TimePeriod::ONE_WEEK;

        $this->getJson(route('api.v1.application.complete'))
            ->assertJson([
                'data' => [
                    'logo' => 'testlogo.svg',
                    'pagination_page_size' => 123,
                    'room_pagination_page_size' => 123,
                    'room_limit' => -1,
                    'banner' => [
                        'enabled' => false,
                        'message' => 'Welcome to Test!',
                        'title' => 'Welcome',
                        'color' => '#fff',
                        'background' => '#4a5c66',
                        'link' => 'http://localhost',
                        'icon' => 'fas fa-door-open',
                    ],
                    'statistics' => [
                        'servers' => [
                            'enabled' => false,
                            'retention_period' => 7,
                        ],
                        'meetings' => [
                            'enabled' => true,
                            'retention_period' => 90,
                        ],
                    ],
                    'attendance' => [
                        'retention_period' => 14,
                    ],
                    'room_auto_delete' => [
                        'inactive_period' => 14,
                        'never_used_period' => 7,
                        'deadline_period' => 7,
                    ],
                ],
            ])
            ->assertSuccessful();
    }

    public function testAllApplicationSettingsReturnedOnUpdate()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'name' => 'test',
            'logo' => 'testlogo.svg',
            'favicon' => 'favicon.ico',
            'bbb' => [
                'logo' => 'bbblogo.png',
            ],
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'help_url' => 'http://localhost',
            'legal_notice_url' => 'http://localhost',
            'privacy_policy_url' => 'http://localhost',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => false,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 7,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'name' => 'test',
                    'logo' => 'testlogo.svg',
                    'favicon' => 'favicon.ico',
                    'pagination_page_size' => 10,
                    'room_pagination_page_size' => 15,
                    'toast_lifetime' => 10,
                    'room_limit' => -1,
                    'bbb' => [
                        'logo' => 'bbblogo.png',
                    ],
                    'banner' => [
                        'enabled' => false,
                        'message' => 'Welcome to Test!',
                        'title' => 'Welcome',
                        'color' => '#fff',
                        'background' => '#4a5c66',
                        'link' => 'http://localhost',
                        'icon' => 'fas fa-door-open',
                    ],
                    'password_change_allowed' => true,
                    'default_timezone' => 'Europe/Berlin',
                    'help_url' => 'http://localhost',
                    'legal_notice_url' => 'http://localhost',
                    'privacy_policy_url' => 'http://localhost',
                    'room_token_expiration' => -1,
                    'statistics' => [
                        'servers' => [
                            'enabled' => false,
                            'retention_period' => 7,
                        ],
                        'meetings' => [
                            'enabled' => true,
                            'retention_period' => 90,
                        ],
                    ],
                    'attendance' => [
                        'retention_period' => 14,
                    ],
                    'recording' => [
                        'retention_period' => 7,
                        'max_retention_period' => -1,
                    ],
                    'room_auto_delete' => [
                        'inactive_period' => 14,
                        'never_used_period' => 30,
                        'deadline_period' => 7,
                    ],
                ],
            ]);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->help_url);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->legal_notice_url);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->privacy_policy_url);

        $payload['help_url'] = '';
        $payload['legal_notice_url'] = '';
        $payload['privacy_policy_url'] = '';

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();

        $this->assertNull(app(GeneralSettings::class)->help_url);
        $this->assertNull(app(GeneralSettings::class)->legal_notice_url);
        $this->assertNull(app(GeneralSettings::class)->privacy_policy_url);
    }

    /**
     * Tests that updates application settings with valid inputs and image file upload
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithValidInputsImageFile()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'name' => 'test',
            'logo_file' => UploadedFile::fake()->image('logo.svg'),
            'favicon_file' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'bbb' => [
                'logo_file' => UploadedFile::fake()->image('bbblogo.png'),
            ],
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => false,
            'default_timezone' => 'Europe/Berlin',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => false,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 7,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();
    }

    /**
     * Tests that updates application settings with valid inputs and and image url
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithValidInputsImageUrl()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'name' => 'test',
            'favicon' => '/storage/image/testfavicon.ico',
            'logo' => '/storage/image/testlogo.svg',
            'bbb' => [
                'logo' => '/storage/image/testbbblogo.png',
            ],
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 5,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => false,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 7,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $response = $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();

        $this->assertEquals($response->json('data.logo'), '/storage/image/testlogo.svg');
        $this->assertEquals($response->json('data.favicon'), '/storage/image/testfavicon.ico');
        $this->assertEquals($response->json('data.bbb.logo'), '/storage/image/testbbblogo.png');
    }

    /**
     * Tests that updates application settings with valid inputs, having a file url and file upload.
     * Uploaded files should have a higher priority and overwrite possible urls
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithValidInputsImageFileAndUrl()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'name' => 'test',
            'logo' => '/storage/image/testfile.svg',
            'logo_file' => UploadedFile::fake()->image('logo.svg'),
            'favicon' => '/storage/image/favicon.ico',
            'favicon_file' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'bbb' => [
                'logo' => '/storage/image/bbbtestlogo.png',
                'logo_file' => UploadedFile::fake()->image('bbblogo.png'),
            ],
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => false,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 7,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $response = $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload);
        $response->assertSuccessful();

        $this->assertNotEquals($response->json('data.logo'), '/storage/image/testfile.svg');
        $this->assertNotEquals($response->json('data.favicon'), '/storage/image/favicon.ico');
        $this->assertNotEquals($response->json('data.bbb.logo'), '/storage/image/bbbtestlogo.png');
    }

    /**
     * Tests that updates application settings with invalid inputs
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithInvalidInputs()
    {
        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        config(['recording.max_retention_period' => -1]);

        $payload = [
            'name' => '',
            'favicon' => '',
            'favicon_file' => 'notimagefile',
            'logo' => '',
            'logo_file' => 'notimagefile',
            'bbb' => [
                'logo' => '',
                'logo_file' => 'notimagefile',
            ],
            'pagination_page_size' => 'notnumber',
            'room_pagination_page_size' => 'notnumber',
            'toast_lifetime' => 'notnumber',
            'room_limit' => 'notnumber',
            'password_change_allowed' => 'foo',
            'default_timezone' => 'timezone',
            'help_url' => 33,
            'legal_notice_url' => 44,
            'privacy_policy_url' => 55,
            'room_token_expiration' => 123,
            'statistics' => [
                'servers' => [
                    'enabled' => 'test',
                    'retention_period' => false,
                ],
                'meetings' => [
                    'enabled' => null,
                    'retention_period' => true,
                ],
            ],
            'attendance' => [
                'retention_period' => 'test',
            ],
            'recording' => [
                'retention_period' => 'test',
            ],
            'room_auto_delete' => [
                'inactive_period' => false,
                'never_used_period' => false,
                'deadline_period' => false,
            ],
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'favicon_file',
                'favicon',
                'logo',
                'logo_file',
                'pagination_page_size',
                'room_pagination_page_size',
                'toast_lifetime',
                'room_limit',
                'banner',
                'password_change_allowed',
                'default_timezone',
                'help_url',
                'legal_notice_url',
                'privacy_policy_url',
                'statistics.servers.enabled',
                'statistics.servers.retention_period',
                'statistics.meetings.enabled',
                'statistics.meetings.retention_period',
                'attendance.retention_period',
                'recording.retention_period',
                'room_token_expiration',
                'bbb.logo',
                'bbb.logo_file',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',

            ]);

        $payload = [
            'name' => 'test',
            'favicon' => '/storage/image/favicon.ico',
            'logo' => '/storage/image/testfile.svg',
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => false,
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'help_url' => 'http://localhost',
            'legal_notice_url' => 'http://localhost',
            'privacy_policy_url' => 'http://localhost',
            'room_token_expiration' => -2,
            'statistics' => [
                'servers' => [
                    'enabled' => true,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 99,
            ],
            'room_auto_delete' => [
                'inactive_period' => 30,
                'never_used_period' => 7,
                'deadline_period' => 14,
            ],
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner',
                'room_token_expiration',
                'recording.retention_period',
            ])
            ->assertJsonMissingValidationErrors([
                'help_url',
                'legal_notice_url',
                'privacy_policy_url',
            ]);

        $payload['banner'] = [
            'enabled' => 'foo',
        ];
        $payload['room_token_expiration'] = 7;
        $payload['help_url'] = '';
        $payload['legal_notice_url'] = '';
        $payload['privacy_policy_url'] = '';

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.enabled',
            ])
            ->assertJsonMissingValidationErrors([
                'help_url',
                'legal_notice_url',
                'privacy_policy_url',
                'room_token_expiration',
            ]);

        $payload['banner'] = [
            'enabled' => true,
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.message',
                'banner.color',
                'banner.background',
            ]);

        $payload['banner'] = [
            'enabled' => true,
            'title' => str_repeat('a', 256),
            'message' => str_repeat('a', 501),
            'link' => 'test',
            'link_style' => 'test',
            'icon' => 'test-test',
            'color' => 'test-test',
            'background' => 'test-test',
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.message',
                'banner.color',
                'banner.background',
                'banner.link',
                'banner.icon',
                'banner.title',
                'banner.link_style',
                'banner.link_target',
            ]);
    }

    /**
     * Tests that updates application settings with invalid inputs for numeric input
     *
     * @return void
     */
    public function testUpdateApplicationSettingsMinMax()
    {
        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        config(['recording.max_retention_period' => -1]);

        // inputs lower than allowed minimum
        $this->actingAs($this->user)->putJson(
            route('api.v1.application.update'),
            [
                'name' => 'test',
                'favicon' => '/storage/image/favicon.ico',
                'logo' => '/storage/image/testfile.svg',
                'pagination_page_size' => 0,
                'room_pagination_page_size' => 0,
                'toast_lifetime' => -1,
                'room_limit' => -2,
                'banner' => ['enabled' => false],
                'statistics' => [
                    'servers' => [
                        'enabled' => true,
                        'retention_period' => 0,
                    ],
                    'meetings' => [
                        'enabled' => true,
                        'retention_period' => 0,
                    ],
                ],
                'attendance' => [
                    'retention_period' => 1,
                ],
                'recording' => [
                    'retention_period' => 1,
                ],
                'room_auto_delete' => [
                    'inactive_period' => 1,
                    'never_used_period' => 1,
                    'deadline_period' => 1,
                ],
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'room_pagination_page_size',
                'room_limit',
                'toast_lifetime',
                'statistics.servers.retention_period',
                'statistics.meetings.retention_period',
                'attendance.retention_period',
                'recording.retention_period',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',
            ]);

        config(['recording.max_retention_period' => 30]);

        // inputs higher than allowed minimum
        $this->putJson(
            route('api.v1.application.update'),
            [
                'name' => 'test',
                'favicon' => '/storage/image/favicon.ico',
                'logo' => '/storage/image/testfile.svg',
                'pagination_page_size' => 101,
                'room_pagination_page_size' => 26,
                'toast_lifetime' => 31,
                'room_limit' => 101,
                'banner' => ['enabled' => false],
                'statistics' => [
                    'servers' => [
                        'enabled' => true,
                        'retention_period' => 366,
                    ],
                    'meetings' => [
                        'enabled' => true,
                        'retention_period' => 366,
                    ],
                ],
                'attendance' => [
                    'retention_period' => 366,
                ],
                'recording' => [
                    'retention_period' => 90,
                ],
                'room_auto_delete' => [
                    'inactive_period' => 1000,
                    'never_used_period' => 1000,
                    'deadline_period' => 365,
                ],
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'room_pagination_page_size',
                'toast_lifetime',
                'room_limit',
                'statistics.servers.retention_period',
                'statistics.meetings.retention_period',
                'attendance.retention_period',
                'recording.retention_period',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',
            ]);

        // test setting recording retention period to a value higher than max allowed retention period
        $this->putJson(
            route('api.v1.application.update'),
            [
                'recording' => [
                    'retention_period' => -1,
                ],
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'recording.retention_period',
            ]);
    }

    public function testApplicationSettingsDefaultPresentation()
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        config(['bigbluebutton.allowed_file_mimes' => 'pdf,jpg']);
        config(['bigbluebutton.max_filesize' => 5]);
        config(['recording.max_retention_period' => -1]);

        $request = [
            'name' => 'test',
            'favicon' => '/storage/image/favicon.ico',
            'logo' => '/storage/image/testfile.svg',
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'bbb' => [
                'default_presentation' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            ],
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => true,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 90,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        // Invalid mime
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb.default_presentation',
            ]);

        // Too big file
        $request['bbb']['default_presentation'] = UploadedFile::fake()->create('favicon.ico', 6000, 'image/x-icon');
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb.default_presentation',
            ]);

        // Not a file
        $request['bbb']['default_presentation'] = 'Test';
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb.default_presentation',
            ]);

        // Valid file
        $valid_file1 = UploadedFile::fake()->create('default_presentation.pdf', 200, 'application/pdf');
        $request['bbb']['default_presentation'] = $valid_file1;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.default_presentation', Storage::disk('public')->url('default_presentation/default.pdf'));
        Storage::disk('public')->assertExists('default_presentation/default.pdf');

        // Update old file gets deleted
        $valid_file2 = UploadedFile::fake()->create('default_presentation.jpg', str_repeat('a', 200), 'image/jpg');
        $request['bbb']['default_presentation'] = $valid_file2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.default_presentation', Storage::disk('public')->url('default_presentation/default.jpg'));
        Storage::disk('public')->assertExists('default_presentation/default.jpg');
        Storage::disk('public')->assertMissing('default_presentation/default.pdf');

        // Clear default presentation (file deleted and setting removed)
        $request['bbb']['default_presentation'] = '';
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->default_presentation);
        Storage::disk('public')->assertMissing('default_presentation/default.jpg');
    }

    /**
     * Test to update the custom bbb style sheet
     *
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function testApplicationSettingsBBBStyle()
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $style = UploadedFile::fake()->create('style.css');
        file_put_contents($style->getRealPath(), 'body { background-color: #273035; }');

        config(['recording.max_retention_period' => -1]);

        $request = [
            'bbb' => [
                'style' => $style,
            ],
            'name' => 'test',
            'favicon' => '/storage/image/favicon.ico',
            'logo' => '/storage/image/testfile.svg',
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => true,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 90,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');

        $this->assertEquals('body { background-color: #273035; }', Storage::disk('public')->get('styles/bbb.css'));

        // Update old file gets deleted
        $style2 = UploadedFile::fake()->create('style.css');
        file_put_contents($style2->getRealPath(), 'body { background-color: #000; }');

        $request['bbb']['style'] = $style2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');
        $this->assertEquals('body { background-color: #000; }', Storage::disk('public')->get('styles/bbb.css'));

        // Send request without changes, should keep the style unchanged
        unset($request['bbb']['style']);
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');
        $this->assertEquals('body { background-color: #000; }', Storage::disk('public')->get('styles/bbb.css'));

        // Clear default presentation (file deleted and setting removed)
        $request['bbb']['style'] = null;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->style);
        Storage::disk('public')->assertMissing('styles/bbb.css');
    }

    /**
     * Test to update the bbb logo
     *
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function testApplicationSettingsBBBLogo()
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $logo = UploadedFile::fake()->create('logo.png');

        config(['recording.max_retention_period' => -1]);

        $request = [
            'bbb' => [
                'logo_file' => $logo,
            ],
            'name' => 'test',
            'favicon' => '/storage/image/favicon.ico',
            'logo' => '/storage/image/testfile.svg',
            'pagination_page_size' => 10,
            'room_pagination_page_size' => 15,
            'toast_lifetime' => 10,
            'room_limit' => -1,
            'banner' => [
                'enabled' => false,
                'message' => 'Welcome to Test!',
                'title' => 'Welcome',
                'color' => '#fff',
                'background' => '#4a5c66',
                'link' => 'http://localhost',
                'link_target' => 'self',
                'link_style' => 'primary',
                'icon' => 'fas fa-door-open',
            ],
            'password_change_allowed' => '1',
            'default_timezone' => 'Europe/Berlin',
            'room_token_expiration' => -1,
            'statistics' => [
                'servers' => [
                    'enabled' => true,
                    'retention_period' => 7,
                ],
                'meetings' => [
                    'enabled' => true,
                    'retention_period' => 90,
                ],
            ],
            'attendance' => [
                'retention_period' => 14,
            ],
            'recording' => [
                'retention_period' => 90,
            ],
            'room_auto_delete' => [
                'inactive_period' => 14,
                'never_used_period' => 30,
                'deadline_period' => 7,
            ],
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.logo', app(BigBlueButtonSettings::class)->logo);

        $path = app(BigBlueButtonSettings::class)->logo;

        // Update logo
        $logo2 = UploadedFile::fake()->create('logo.png');
        $request['bbb']['logo_file'] = $logo2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.logo', app(BigBlueButtonSettings::class)->logo);
        $this->assertNotEquals($path, app(BigBlueButtonSettings::class)->logo);

        // Clear logo
        unset($request['bbb']['logo_file']);
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->logo);
    }
}
