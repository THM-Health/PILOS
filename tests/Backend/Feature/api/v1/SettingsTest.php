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
use App\Settings\RoomSettings;
use Database\Seeders\RolesAndPermissionsSeeder;
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
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
    }

    /**
     * Tests that the all settings are returned
     *
     * @return void
     */
    public function test_view_settings()
    {

        $this->generalSettings->name = 'PILOS';
        $this->generalSettings->pagination_page_size = 123;
        $this->generalSettings->toast_lifetime = 10;
        $this->generalSettings->default_timezone = 'Europe/Berlin';
        $this->generalSettings->help_url = 'http://localhost/help';
        $this->generalSettings->legal_notice_url = 'http://localhost/legal';
        $this->generalSettings->privacy_policy_url = 'http://localhost/privacy';
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
        $this->roomSettings->auto_delete_inactive_period = TimePeriod::ONE_WEEK;
        $this->roomSettings->auto_delete_never_used_period = TimePeriod::TWO_WEEKS;
        $this->roomSettings->auto_delete_deadline_period = TimePeriod::ONE_MONTH;
        $this->roomSettings->token_expiration = TimePeriod::ONE_WEEK;
        $this->roomSettings->file_terms_of_use = 'test';
        $this->roomSettings->save();

        $this->userSettings->password_change_allowed = true;
        $this->userSettings->save();

        $this->recordingSettings->server_usage_enabled = true;
        $this->recordingSettings->server_usage_retention_period = TimePeriod::ONE_WEEK;
        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->meeting_usage_retention_period = TimePeriod::THREE_MONTHS;
        $this->recordingSettings->attendance_retention_period = TimePeriod::TWO_WEEKS;
        $this->recordingSettings->recording_retention_period = TimePeriod::ONE_MONTH;
        $this->recordingSettings->save();

        $this->bigBlueButtonSettings->style = url('style.css');
        $this->bigBlueButtonSettings->logo = url('logo.png');
        $this->bigBlueButtonSettings->default_presentation = url('presentation.pdf');
        $this->bigBlueButtonSettings->save();

        config(['recording.max_retention_period' => 90]);

        // Unauthorized Test
        $this->getJson(route('api.v1.settings.view'))->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->getJson(route('api.v1.settings.view'))->assertForbidden();

        // Add necessary role and permission to user to view application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.viewAny')->first());
        $this->user->roles()->attach($role);

        $this->getJson(route('api.v1.settings.view'))
            ->assertJson([
                'data' => [
                    'general_name' => 'PILOS',
                    'general_pagination_page_size' => 123,
                    'general_toast_lifetime' => 10,
                    'general_default_timezone' => 'Europe/Berlin',
                    'general_help_url' => 'http://localhost/help',
                    'general_legal_notice_url' => 'http://localhost/legal',
                    'general_privacy_policy_url' => 'http://localhost/privacy',
                    'general_no_welcome_page' => false,

                    'theme_logo' => 'testlogo.svg',
                    'theme_logo_dark' => 'testlogo-dark.svg',
                    'theme_favicon' => 'testfavicon.ico',
                    'theme_favicon_dark' => 'testfavicon-dark.ico',
                    'theme_primary_color' => '#4a5c66',
                    'theme_rounded' => true,

                    'banner_enabled' => true,
                    'banner_message' => 'Welcome to Test!',
                    'banner_title' => 'Welcome',
                    'banner_color' => '#fff',
                    'banner_background' => '#4a5c66',
                    'banner_link' => 'http://localhost',
                    'banner_link_text' => 'More',
                    'banner_link_style' => 'primary',
                    'banner_link_target' => 'blank',
                    'banner_icon' => 'fas fa-door-open',

                    'room_limit' => -1,
                    'room_auto_delete_inactive_period' => 7,
                    'room_auto_delete_never_used_period' => 14,
                    'room_auto_delete_deadline_period' => 30,
                    'room_token_expiration' => 7,
                    'room_file_terms_of_use' => 'test',

                    'user_password_change_allowed' => true,

                    'recording_server_usage_enabled' => true,
                    'recording_server_usage_retention_period' => 7,
                    'recording_meeting_usage_enabled' => false,
                    'recording_meeting_usage_retention_period' => 90,
                    'recording_attendance_retention_period' => 14,
                    'recording_recording_retention_period' => 30,

                    'bbb_style' => url('style.css'),
                    'bbb_logo' => url('logo.png'),
                    'bbb_default_presentation' => url('presentation.pdf'),
                ],
                'meta' => [
                    'link_btn_styles' => array_column(LinkButtonStyle::cases(), 'value'),
                    'link_targets' => array_column(LinkTarget::cases(), 'value'),
                    'recording_max_retention_period' => 90,
                ],
            ])
            ->assertSuccessful();
    }

    public function test_update_settings()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => true,

            'theme_logo' => 'testlogo.svg',
            'theme_logo_dark' => 'testlogo-dark.svg',
            'theme_favicon' => 'testfavicon.ico',
            'theme_favicon_dark' => 'testfavicon-dark.ico',
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,
            'room_file_terms_of_use' => 'test',

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo' => 'bbblogo.png',
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.settings.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'general_name' => 'test',
                    'general_pagination_page_size' => 10,
                    'general_toast_lifetime' => 10,
                    'general_default_timezone' => 'Europe/Berlin',
                    'general_help_url' => 'http://localhost',
                    'general_legal_notice_url' => 'http://localhost',
                    'general_privacy_policy_url' => 'http://localhost',
                    'general_no_welcome_page' => true,

                    'theme_logo' => 'testlogo.svg',
                    'theme_logo_dark' => 'testlogo-dark.svg',
                    'theme_favicon' => 'testfavicon.ico',
                    'theme_favicon_dark' => 'testfavicon-dark.ico',
                    'theme_primary_color' => '#4a5c66',
                    'theme_rounded' => true,

                    'banner_enabled' => 0,
                    'banner_message' => 'Welcome to Test!',
                    'banner_title' => 'Welcome',
                    'banner_color' => '#fff',
                    'banner_background' => '#4a5c66',
                    'banner_link' => 'http://localhost',
                    'banner_icon' => 'fas fa-door-open',

                    'room_limit' => -1,
                    'room_token_expiration' => -1,
                    'room_auto_delete_inactive_period' => 14,
                    'room_auto_delete_never_used_period' => 30,
                    'room_auto_delete_deadline_period' => 7,
                    'room_file_terms_of_use' => 'test',

                    'user_password_change_allowed' => 1,

                    'recording_server_usage_enabled' => 0,
                    'recording_server_usage_retention_period' => 7,
                    'recording_meeting_usage_enabled' => 1,
                    'recording_meeting_usage_retention_period' => 90,
                    'recording_attendance_retention_period' => 14,
                    'recording_recording_retention_period' => 7,

                    'bbb_logo' => 'bbblogo.png',
                ],
            ]);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->help_url);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->legal_notice_url);
        $this->assertEquals('http://localhost', app(GeneralSettings::class)->privacy_policy_url);

        $payload['general_help_url'] = '';
        $payload['general_legal_notice_url'] = '';
        $payload['general_privacy_policy_url'] = '';
        $payload['room_file_terms_of_use'] = '';

        $this->putJson(route('api.v1.settings.update'), $payload)
            ->assertSuccessful();

        $this->assertNull(app(GeneralSettings::class)->help_url);
        $this->assertNull(app(GeneralSettings::class)->legal_notice_url);
        $this->assertNull(app(GeneralSettings::class)->privacy_policy_url);
        $this->assertNull(app(RoomSettings::class)->file_terms_of_use);
    }

    /**
     * Tests that updates application settings with valid inputs and image file upload
     *
     * @return void
     */
    public function test_update_with_valid_inputs_image_file()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'theme_logo_file' => UploadedFile::fake()->image('logo.svg'),
            'theme_logo_dark_file' => UploadedFile::fake()->image('logo-dark.svg'),
            'theme_favicon_file' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'theme_favicon_dark_file' => UploadedFile::fake()->create('favicon-dark.ico', 100, 'image/x-icon'),
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo_file' => UploadedFile::fake()->image('bbblogo.png'),
        ];

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        $response = $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload);
        $response->assertSuccessful();

        // Check if the files are correctly stored
        $this->assertStringStartsWith('/storage/images/', $response->json('data.theme_logo'));
        $this->assertStringStartsWith('/storage/images/', $response->json('data.theme_logo_dark'));
        $this->assertStringStartsWith('/storage/images/', $response->json('data.theme_favicon'));
        $this->assertStringStartsWith('/storage/images/', $response->json('data.theme_favicon_dark'));
        $this->assertStringStartsWith('http://localhost/storage/images/', $response->json('data.bbb_logo'));
    }

    /**
     * Tests that updates application settings with valid inputs, having a file url and file upload.
     * Uploaded files should have a higher priority and overwrite possible urls
     *
     * @return void
     */
    public function test_update_with_valid_inputs_image_file_and_url()
    {
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'theme_logo' => '/storage/image/logo.svg',
            'theme_logo_file' => UploadedFile::fake()->image('logo.svg'),
            'theme_logo_dark' => '/storage/image/logo_dark.svg',
            'theme_logo_dark_file' => UploadedFile::fake()->image('logo_dark.svg'),
            'theme_favicon' => '/storage/image/favicon.ico',
            'theme_favicon_file' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'theme_favicon_dark' => '/storage/image/favicon_dark.ico',
            'theme_favicon_dark_file' => UploadedFile::fake()->create('favicon_dark.ico', 100, 'image/x-icon'),
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo' => '/storage/image/bbbtestlogo.png',
            'bbb_logo_file' => UploadedFile::fake()->image('bbblogo.png'),
        ];

        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        $response = $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload);
        $response->assertSuccessful();

        $this->assertNotEquals('/storage/image/logo.svg', $response->json('data.logo'));
        $this->assertNotEquals('/storage/image/favicon.ico', $response->json('data.favicon'));
        $this->assertNotEquals('/storage/image/logo_dark.svg', $response->json('data.logo'));
        $this->assertNotEquals('/storage/image/favicon_dark.ico', $response->json('data.favicon'));
        $this->assertNotEquals('/storage/image/bbbtestlogo.png', $response->json('data.bbb.logo'));
    }

    /**
     * Tests that updates application settings with invalid inputs
     *
     * @return void
     */
    public function test_update_with_invalid_inputs()
    {
        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => '',
            'general_pagination_page_size' => 'notnumber',
            'general_toast_lifetime' => 'notnumber',
            'general_default_timezone' => 'timezone',
            'general_help_url' => 111,
            'general_legal_notice_url' => 222,
            'general_privacy_policy_url' => 333,
            'general_no_welcome_page' => 'notbool',

            'theme_logo' => '',
            'theme_logo_file' => 'notimagefile',
            'theme_logo_dark' => '',
            'theme_logo_dark_file' => 'notimagefile',
            'theme_favicon' => '',
            'theme_favicon_file' => 'notimagefile',
            'theme_favicon_dark' => '',
            'theme_favicon_dark_file' => 'notimagefile',
            'theme_primary_color' => 'notcolor',
            'theme_rounded' => 'notbool',

            'banner_enabled' => 'foo',
            'banner_title' => str_repeat('a', 256),
            'banner_message' => str_repeat('a', 501),
            'banner_link' => 'test',
            'banner_link_style' => 'test',
            'banner_icon' => 'test',
            'banner_color' => 'test',
            'banner_background' => 'test',

            'room_limit' => 'notnumber',
            'room_token_expiration' => 'notnumber',
            'room_auto_delete_inactive_period' => 'notnumber',
            'room_auto_delete_never_used_period' => 'notnumber',
            'room_auto_delete_deadline_period' => 'notnumber',

            'user_password_change_allowed' => 'foo',

            'recording_server_usage_enabled' => 'foo',
            'recording_server_usage_retention_period' => 'notnumber',
            'recording_meeting_usage_enabled' => 'foo',
            'recording_meeting_usage_retention_period' => 'notnumber',
            'recording_attendance_retention_period' => 'notnumber',
            'recording_recording_retention_period' => 'notnumber',

            'bbb_logo' => '',
            'bbb_logo_file' => 'notimagefile',
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'general_name',
                'general_pagination_page_size',
                'general_toast_lifetime',
                'general_default_timezone',
                'general_help_url',
                'general_legal_notice_url',
                'general_privacy_policy_url',
                'general_no_welcome_page',

                'theme_logo',
                'theme_logo_file',
                'theme_logo_dark',
                'theme_logo_dark_file',
                'theme_favicon',
                'theme_favicon_file',
                'theme_favicon_dark',
                'theme_favicon_dark_file',
                'theme_primary_color',
                'theme_rounded',

                'banner_enabled',
                'banner_title',
                'banner_message',
                'banner_link',
                'banner_link_style',
                'banner_link_target',
                'banner_icon',
                'banner_color',
                'banner_background',

                'room_limit',
                'room_token_expiration',
                'room_auto_delete_inactive_period',
                'room_auto_delete_never_used_period',
                'room_auto_delete_deadline_period',

                'user_password_change_allowed',

                'recording_server_usage_enabled',
                'recording_server_usage_retention_period',
                'recording_meeting_usage_enabled',
                'recording_meeting_usage_retention_period',
                'recording_attendance_retention_period',
                'recording_recording_retention_period',

                'bbb_logo',
                'bbb_logo_file',
            ]);

        // Test that not all banner fields are required when banner is disabled
        $payload['banner_enabled'] = 0;
        unset($payload['banner_title']);
        unset($payload['banner_message']);
        unset($payload['banner_link']);
        unset($payload['banner_icon']);
        unset($payload['banner_color']);
        unset($payload['banner_background']);

        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertJsonMissingValidationErrors([
                'banner_enabled',
                'banner_title',
                'banner_message',
                'banner_link',
                'banner_icon',
                'banner_color',
                'banner_background',
            ]);
    }

    /**
     * Tests that updates application settings with invalid inputs for numeric input
     *
     * @return void
     */
    public function test_update_min_max()
    {
        // Add necessary role and permission to user to update application settings
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        config(['recording.max_retention_period' => -1]);

        // inputs lower than allowed minimum
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), [
            'general_name' => 'test',
            'general_logo' => 'testlogo.svg',
            'general_favicon' => 'favicon.ico',
            'general_pagination_page_size' => 0,
            'general_toast_lifetime' => -1,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -2,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 1,
            'room_auto_delete_never_used_period' => 1,
            'room_auto_delete_deadline_period' => 1,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 1,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 1,
            'recording_attendance_retention_period' => 1,
            'recording_recording_retention_period' => 1,

            'bbb_logo' => 'bbblogo.png',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'general_pagination_page_size',
                'general_toast_lifetime',
                'room_limit',
                'room_auto_delete_inactive_period',
                'room_auto_delete_never_used_period',
                'room_auto_delete_deadline_period',
                'recording_server_usage_retention_period',
                'recording_meeting_usage_retention_period',
                'recording_attendance_retention_period',
                'recording_recording_retention_period',
            ]);

        config(['recording.max_retention_period' => 30]);

        // inputs higher than allowed maximum
        $this->putJson(route('api.v1.settings.update'), [
            'general_name' => 'test',
            'general_logo' => 'testlogo.svg',
            'general_favicon' => 'favicon.ico',
            'general_pagination_page_size' => 101,
            'general_toast_lifetime' => -1,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => 101,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 1000,
            'room_auto_delete_never_used_period' => 1000,
            'room_auto_delete_deadline_period' => 366,
            'room_file_terms_of_use' => str_repeat('a', 65001),

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 366,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 366,
            'recording_attendance_retention_period' => 366,
            'recording_recording_retention_period' => 90,

            'bbb_logo' => 'bbblogo.png',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'general_pagination_page_size',
                'general_toast_lifetime',
                'room_limit',
                'room_auto_delete_inactive_period',
                'room_auto_delete_never_used_period',
                'room_auto_delete_deadline_period',
                'room_file_terms_of_use',
                'recording_server_usage_retention_period',
                'recording_meeting_usage_retention_period',
                'recording_attendance_retention_period',
                'recording_recording_retention_period',
            ]);

        // test setting recording retention period to a value higher than max allowed retention period
        $this->putJson(route('api.v1.settings.update'), [
            'recording_recording_retention_period' => -1,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'recording_recording_retention_period',
            ]);
    }

    public function test_update_default_presentation()
    {
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        config(['bigbluebutton.allowed_file_mimes' => 'pdf,jpg']);
        config(['bigbluebutton.max_filesize' => 5]);
        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'theme_logo' => 'testlogo.svg',
            'theme_logo_dark' => 'testlogo-dark.svg',
            'theme_favicon' => 'favicon.ico',
            'theme_favicon_dark' => 'favicon_dark.ico',
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo' => 'bbblogo.png',
            'bbb_default_presentation' => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
        ];

        // Invalid mime
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb_default_presentation',
            ]);

        // Too big file
        $payload['bbb_default_presentation'] = UploadedFile::fake()->create('favicon.ico', 6000, 'image/x-icon');
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb_default_presentation',
            ]);

        // Not a file
        $payload['bbb_default_presentation'] = 'Test';
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'bbb_default_presentation',
            ]);

        // Valid file
        $valid_file1 = UploadedFile::fake()->create('default_presentation.pdf', 200, 'application/pdf');
        $payload['bbb_default_presentation'] = $valid_file1;
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_default_presentation', Storage::disk('public')->url('default_presentation/default.pdf'));
        Storage::disk('public')->assertExists('default_presentation/default.pdf');

        // Update old file gets deleted
        $valid_file2 = UploadedFile::fake()->create('default_presentation.jpg', str_repeat('a', 200), 'image/jpg');
        $payload['bbb_default_presentation'] = $valid_file2;
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_default_presentation', Storage::disk('public')->url('default_presentation/default.jpg'));
        Storage::disk('public')->assertExists('default_presentation/default.jpg');
        Storage::disk('public')->assertMissing('default_presentation/default.pdf');

        // Clear default presentation (file deleted and setting removed)
        $payload['bbb_default_presentation'] = '';
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->default_presentation);
        Storage::disk('public')->assertMissing('default_presentation/default.jpg');
    }

    /**
     * Test to update the custom bbb style sheet
     *
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function test_update_bbb_style()
    {
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        $style = UploadedFile::fake()->create('style.css');
        file_put_contents($style->getRealPath(), 'body { background-color: #273035; }');

        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'theme_logo' => 'testlogo.svg',
            'theme_logo_dark' => 'testlogo-dark.svg',
            'theme_favicon' => 'favicon.ico',
            'theme_favicon_dark' => 'favicon_dark.ico',
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo' => 'bbblogo.png',
            'bbb_style' => $style,
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');

        $this->assertEquals('body { background-color: #273035; }', Storage::disk('public')->get('styles/bbb.css'));

        // Update old file gets deleted
        $style2 = UploadedFile::fake()->create('style.css');
        file_put_contents($style2->getRealPath(), 'body { background-color: #000; }');

        $payload['bbb_style'] = $style2;
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');
        $this->assertEquals('body { background-color: #000; }', Storage::disk('public')->get('styles/bbb.css'));

        // Send request without changes, should keep the style unchanged
        unset($payload['bbb_style']);
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');
        $this->assertEquals('body { background-color: #000; }', Storage::disk('public')->get('styles/bbb.css'));

        // Clear default presentation (file deleted and setting removed)
        $payload['bbb_style'] = null;
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->style);
        Storage::disk('public')->assertMissing('styles/bbb.css');
    }

    /**
     * Test to update the bbb logo
     *
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function test_update_bbb_logo()
    {
        $role = Role::factory()->create();
        $role->permissions()->attach(Permission::where('name', 'settings.update')->first());
        $this->user->roles()->attach($role);

        $logo = UploadedFile::fake()->create('logo.png');

        config(['recording.max_retention_period' => -1]);

        $payload = [
            'general_name' => 'test',
            'general_pagination_page_size' => 10,
            'general_toast_lifetime' => 10,
            'general_default_timezone' => 'Europe/Berlin',
            'general_help_url' => 'http://localhost',
            'general_legal_notice_url' => 'http://localhost',
            'general_privacy_policy_url' => 'http://localhost',
            'general_no_welcome_page' => false,

            'theme_logo' => 'testlogo.svg',
            'theme_logo_dark' => 'testlogo-dark.svg',
            'theme_favicon' => 'favicon.ico',
            'theme_favicon_dark' => 'favicon_dark.ico',
            'theme_primary_color' => '#4a5c66',
            'theme_rounded' => true,

            'banner_enabled' => 0,
            'banner_message' => 'Welcome to Test!',
            'banner_title' => 'Welcome',
            'banner_color' => '#fff',
            'banner_background' => '#4a5c66',
            'banner_link' => 'http://localhost',
            'banner_link_target' => 'self',
            'banner_link_style' => 'primary',
            'banner_icon' => 'fas fa-door-open',

            'room_limit' => -1,
            'room_token_expiration' => -1,
            'room_auto_delete_inactive_period' => 14,
            'room_auto_delete_never_used_period' => 30,
            'room_auto_delete_deadline_period' => 7,

            'user_password_change_allowed' => 1,

            'recording_server_usage_enabled' => 0,
            'recording_server_usage_retention_period' => 7,
            'recording_meeting_usage_enabled' => 1,
            'recording_meeting_usage_retention_period' => 90,
            'recording_attendance_retention_period' => 14,
            'recording_recording_retention_period' => 7,

            'bbb_logo_file' => $logo,
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_logo', app(BigBlueButtonSettings::class)->logo);

        $path = app(BigBlueButtonSettings::class)->logo;

        // Update logo
        $logo2 = UploadedFile::fake()->create('logo.png');
        $payload['bbb_logo_file'] = $logo2;
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb_logo', app(BigBlueButtonSettings::class)->logo);
        $this->assertNotEquals($path, app(BigBlueButtonSettings::class)->logo);

        // Clear logo
        unset($payload['bbb_logo_file']);
        $this->actingAs($this->user)->putJson(route('api.v1.settings.update'), $payload)
            ->assertSuccessful();
        $this->assertNull(app(BigBlueButtonSettings::class)->logo);
    }
}
