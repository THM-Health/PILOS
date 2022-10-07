<?php

namespace Tests\Feature\api\v1;

use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

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
        setting(['logo' => 'testlogo.svg']);
        setting(['pagination_page_size' => '123']);
        setting(['own_rooms_pagination_page_size' => '123']);
        setting(['room_limit' => '-1']);
        setting(['banner' => [
            'enabled'    => true,
            'message'    => 'Welcome to Test!',
            'title'      => 'Welcome',
            'color'      => '#fff',
            'background' => '#4a5c66',
            'link'       => 'http://localhost',
            'icon'       => 'fas fa-door-open',
        ]]);
        setting(['help_url' => 'http://localhost']);
        setting(['legal_notice_url' => 'http://localhost']);
        setting(['privacy_policy_url' => 'http://localhost']);
        setting(['room_token_expiration' => -1]);
        setting(['room_refresh_rate' => 20]);
        config(['app.url' => 'https://domain.tld']);

        setting(['statistics' => [
            'meetings' => [
                'enabled'           => true,
                'retention_period'  => 90
            ],
        ]]);

        setting(['attendance' => [
            'enabled'           => false,
            'retention_period'  => 14
        ]]);

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'base_url'                       => 'https://domain.tld',
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                    'banner'                         => [
                        'enabled'    => true,
                        'message'    => 'Welcome to Test!',
                        'title'      => 'Welcome',
                        'color'      => '#fff',
                        'background' => '#4a5c66',
                        'link'       => 'http://localhost',
                        'icon'       => 'fas fa-door-open',
                    ],
                    'help_url'           => 'http://localhost',
                    'legal_notice_url'   => 'http://localhost',
                    'privacy_policy_url' => 'http://localhost',
                    'statistics'         => [
                        'meetings' => [
                            'enabled'           => true,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => false,
                        'retention_period'  => 14
                    ],
                    'room_token_expiration' => -1,
                    'room_refresh_rate'     => 20,
                ]
            ])
            ->assertSuccessful();

        setting(['banner' => [
            'enabled'    => false,
            'message'    => 'Welcome to Test!',
            'title'      => 'Welcome',
            'color'      => '#fff',
            'background' => '#4a5c66',
            'link'       => 'http://localhost',
            'icon'       => 'fas fa-door-open',
        ]]);
        setting(['help_url' => null]);
        setting(['legal_notice_url' => null]);
        setting(['privacy_policy_url' => null]);

        setting(['statistics' => [
            'meetings' => [
                'enabled'           => false,
                'retention_period'  => 90
            ],
        ]]);

        setting(['attendance' => [
            'enabled'           => true,
            'retention_period'  => 14
        ]]);

        setting(['room_token_expiration' => 100]);
        setting(['room_refresh_rate' => 5.5]);

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                    'banner'                         => [
                        'enabled'    => false
                    ],
                    'help_url'            => null,
                    'legal_notice_url'    => null,
                    'privacy_policy_url'  => null,
                    'statistics'          => [
                        'meetings' => [
                            'enabled'           => false,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => true,
                        'retention_period'  => 14
                    ],
                    'room_token_expiration' => 100,
                    'room_refresh_rate'     => 5.5,
                ]
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
        setting(['logo' => 'testlogo.svg']);
        setting(['pagination_page_size' => '123']);
        setting(['own_rooms_pagination_page_size' => '123']);
        setting(['room_limit' => '-1']);
        setting(['banner' => [
            'enabled'    => true,
            'message'    => 'Welcome to Test!',
            'title'      => 'Welcome',
            'color'      => '#fff',
            'background' => '#4a5c66',
            'link'       => 'http://localhost',
            'icon'       => 'fas fa-door-open',
        ]]);

        setting(['bbb_style' => url('style.css')]);
        setting(['bbb_logo' => url('logo.png')]);
        config(['bigbluebutton.allowed_file_mimes' => 'pdf,doc,docx,xls']);
        config(['bigbluebutton.max_filesize' => 10]);
        config(['bigbluebutton.room_name_limit' => 20]);
        config(['bigbluebutton.welcome_message_limit' => 100]);
        config(['app.url' => 'https://domain.tld']);
        setting(['room_refresh_rate' => 20]);

        setting(['statistics' => [
            'servers' => [
                'enabled'           => true,
                'retention_period'  => 7
            ],
            'meetings' => [
                'enabled'           => false,
                'retention_period'  => 90
            ],
        ]]);

        setting(['attendance' => [
            'enabled'           => true,
            'retention_period'  => 14
        ]]);

        setting(['room_auto_delete' => [
            'enabled'            => false,
            'inactive_period'    => 7,
            'never_used_period'  => 14,
            'deadline_period'    => 30
        ]]);

        $this->getJson(route('api.v1.application.complete'))->assertUnauthorized();
        $this->actingAs($this->user)->getJson(route('api.v1.application.complete'))->assertForbidden();

        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->getJson(route('api.v1.application.complete'))
            ->assertJson([
                'data' => [
                    'base_url'                       => 'https://domain.tld',
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                    'room_refresh_rate'              => 20,
                    'banner'                         => [
                        'enabled'    => true,
                        'message'    => 'Welcome to Test!',
                        'title'      => 'Welcome',
                        'color'      => '#fff',
                        'background' => '#4a5c66',
                        'link'       => 'http://localhost',
                        'icon'       => 'fas fa-door-open',
                    ],
                    'bbb' => [
                        'file_mimes'            => 'pdf,doc,docx,xls',
                        'max_filesize'          => 10,
                        'room_name_limit'       => 20,
                        'welcome_message_limit' => 100,
                        'style'                 => url('style.css'),
                        'logo'                  => url('logo.png'),
                    ],
                    'statistics' => [
                        'servers' => [
                            'enabled'           => true,
                            'retention_period'  => 7
                        ],
                        'meetings' => [
                            'enabled'           => false,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => true,
                        'retention_period'  => 14
                    ],
                    'room_auto_delete' => [
                        'enabled'            => false,
                        'inactive_period'    => 7,
                        'never_used_period'  => 14,
                        'deadline_period'    => 30
                    ],
                ]
            ])
            ->assertSuccessful();

        setting(['banner' => [
            'enabled'    => false,
            'message'    => 'Welcome to Test!',
            'title'      => 'Welcome',
            'color'      => '#fff',
            'background' => '#4a5c66',
            'link'       => 'http://localhost',
            'icon'       => 'fas fa-door-open',
        ]]);

        setting(['statistics' => [
            'servers' => [
                'enabled'           => false,
                'retention_period'  => 7
            ],
            'meetings' => [
                'enabled'           => true,
                'retention_period'  => 90
            ],
        ]]);

        setting(['attendance' => [
            'enabled'           => false,
            'retention_period'  => 14
        ]]);

        setting(['room_auto_delete' => [
            'enabled'            => true,
            'inactive_period'    => 14,
            'never_used_period'  => 7,
            'deadline_period'    => 2
        ]]);

        $this->getJson(route('api.v1.application.complete'))
            ->assertJson([
                'data' => [
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                    'banner'                         => [
                        'enabled'    => false,
                        'message'    => 'Welcome to Test!',
                        'title'      => 'Welcome',
                        'color'      => '#fff',
                        'background' => '#4a5c66',
                        'link'       => 'http://localhost',
                        'icon'       => 'fas fa-door-open',
                    ],
                    'statistics' => [
                        'servers' => [
                            'enabled'           => false,
                            'retention_period'  => 7
                        ],
                        'meetings' => [
                            'enabled'           => true,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => false,
                        'retention_period'  => 14
                    ],
                    'room_auto_delete' => [
                        'enabled'            => true,
                        'inactive_period'    => 14,
                        'never_used_period'  => 7,
                        'deadline_period'    => 2
                    ],
                ]
            ])
            ->assertSuccessful();
    }

    public function testAllApplicationSettingsReturnedOnUpdate()
    {
        $payload = [
            'name'                           => 'test',
            'logo'                           => 'testlogo.svg',
            'favicon'                        => 'favicon.ico',
            'bbb'                            => [
                'logo' => 'bbblogo.png',
            ],
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => [
                'enabled'     => false,
                'message'     => 'Welcome to Test!',
                'title'       => 'Welcome',
                'color'       => '#fff',
                'background'  => '#4a5c66',
                'link'        => 'http://localhost',
                'link_target' => 'self',
                'link_style'  => 'primary',
                'icon'        => 'fas fa-door-open',
            ],
            'password_self_reset_enabled' => '1',
            'default_timezone'            => 'Europe/Berlin',
            'help_url'                    => 'http://localhost',
            'legal_notice_url'            => 'http://localhost',
            'privacy_policy_url'          => 'http://localhost',
            'room_token_expiration'       => -1,
            'statistics'                  => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete'           => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    'name'                           => 'test',
                    'logo'                           => 'testlogo.svg',
                    'favicon'                        => 'favicon.ico',
                    'pagination_page_size'           => 10,
                    'own_rooms_pagination_page_size' => 15,
                    'room_limit'                     => -1,
                    'bbb'                            => [
                      'logo' => 'bbblogo.png'
                    ],
                    'banner'                         => [
                        'enabled'    => false,
                        'message'    => 'Welcome to Test!',
                        'title'      => 'Welcome',
                        'color'      => '#fff',
                        'background' => '#4a5c66',
                        'link'       => 'http://localhost',
                        'icon'       => 'fas fa-door-open',
                    ],
                    'password_self_reset_enabled' => true,
                    'default_timezone'            => 'Europe/Berlin',
                    'help_url'                    => 'http://localhost',
                    'legal_notice_url'            => 'http://localhost',
                    'privacy_policy_url'          => 'http://localhost',
                    'room_token_expiration'       => -1,
                    'statistics'                  => [
                        'servers' => [
                            'enabled'           => false,
                            'retention_period'  => 7
                        ],
                        'meetings' => [
                            'enabled'           => true,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => false,
                        'retention_period'  => 14
                    ],
                    'room_auto_delete' => [
                        'enabled'           => true,
                        'inactive_period'   => 14,
                        'never_used_period' => 30,
                        'deadline_period'   => 7
                    ],
                ]
            ]);
        $this->assertTrue(setting()->has('help_url'));
        $this->assertEquals('http://localhost', setting('help_url'));

        $this->assertTrue(setting()->has('legal_notice_url'));
        $this->assertEquals('http://localhost', setting('legal_notice_url'));

        $this->assertTrue(setting()->has('privacy_policy_url'));
        $this->assertEquals('http://localhost', setting('privacy_policy_url'));

        $payload['help_url']           = '';
        $payload['legal_notice_url']   = '';
        $payload['privacy_policy_url'] = '';

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();

        $this->assertFalse(setting()->has('help_url'));
        $this->assertFalse(setting()->has('legal_notice_url'));
        $this->assertFalse(setting()->has('privacy_policy_url'));
    }

    /**
     * Tests that updates application settings with valid inputs and image file upload
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithValidInputsImageFile()
    {
        $payload = [
            'name'                           => 'test',
            'logo_file'                      => UploadedFile::fake()->image('logo.svg'),
            'favicon_file'                   => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'bbb'                            => [
                'logo_file' => UploadedFile::fake()->image('bbblogo.png'),
            ],
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => false,
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role       = Role::factory()->create();
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
        $payload = [
            'name'                           => 'test',
            'favicon'                        => '/storage/image/testfavicon.ico',
            'logo'                           => '/storage/image/testlogo.svg',
            'bbb'                            => [
                'logo'                           => '/storage/image/testbbblogo.png',
             ],
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role       = Role::factory()->create();
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
        $payload = [
            'name'                           => 'test',
            'logo'                           => '/storage/image/testfile.svg',
            'logo_file'                      => UploadedFile::fake()->image('logo.svg'),
            'favicon'                        => '/storage/image/favicon.ico',
            'favicon_file'                   => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'bbb'                            => [
                'logo'      => '/storage/image/bbbtestlogo.png',
                'logo_file' => UploadedFile::fake()->image('bbblogo.png'),
            ],
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        // Add necessary role and permission to user to update application settings
        $role       = Role::factory()->create();
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
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $payload = [
            'name'                           => '',
            'favicon'                        => '',
            'favicon_file'                   => 'notimagefile',
            'logo'                           => '',
            'logo_file'                      => 'notimagefile',
            'bbb'                            => [
                'logo'                           => '',
                'logo_file'                      => 'notimagefile',
             ],
            'pagination_page_size'           => 'notnumber',
            'own_rooms_pagination_page_size' => 'notnumber',
            'room_limit'                     => 'notnumber',
            'password_self_reset_enabled'    => 'foo',
            'default_timezone'               => 'timezone',
            'help_url'                       => 33,
            'legal_notice_url'               => 44,
            'privacy_policy_url'             => 55,
            'room_token_expiration'          => 123,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => 'test',
                    'retention_period'  => false
                ],
                'meetings' => [
                    'enabled'           => null,
                    'retention_period'  => true
                ]
            ],
            'attendance' => [
                'enabled'           => 90,
                'retention_period'  => 'test'
            ],
            'room_auto_delete' => [
                'enabled'              => 'test',
                'inactive_period'      => false,
                'never_used_period'    => false,
                'deadline_period'      => false,
            ]
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
                'own_rooms_pagination_page_size',
                'room_limit',
                'banner',
                'banner.enabled',
                'password_self_reset_enabled',
                'default_timezone',
                'help_url',
                'legal_notice_url',
                'privacy_policy_url',
                'statistics.servers.enabled',
                'statistics.servers.retention_period',
                'statistics.meetings.enabled',
                'statistics.meetings.retention_period',
                'attendance.enabled',
                'attendance.retention_period',
                'room_token_expiration',
                'bbb.logo',
                'bbb.logo_file',
                'room_auto_delete.enabled',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',

            ]);

        $payload = [
            'name'                           => 'test',
            'favicon'                        => '/storage/image/favicon.ico',
            'logo'                           => '/storage/image/testfile.svg',
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => false,
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'help_url'                       => 'http://localhost',
            'legal_notice_url'               => 'http://localhost',
            'privacy_policy_url'             => 'http://localhost',
            'room_token_expiration'          => -2,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => true,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => true,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 30,
                'never_used_period'    => 7,
                'deadline_period'      => 14,
            ]
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner',
                'banner.enabled',
                'room_token_expiration'
            ])
            ->assertJsonMissingValidationErrors([
                'help_url',
                'legal_notice_url',
                'privacy_policy_url'
            ]);

        $payload['banner'] = [
            'enabled' => 'foo'
        ];
        $payload['room_token_expiration'] = 1440;
        $payload                          = [
            'help_url'              => '',
            'legal_notice_url'      => '',
            'privacy_policy_url'    => ''
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.enabled'
            ])
            ->assertJsonMissingValidationErrors([
                'help_url',
                'legal_notice_url',
                'privacy_policy_url',
                'room_token_expiration'
            ]);

        $payload['banner'] = [
            'enabled' => true
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.message',
                'banner.color',
                'banner.background',
            ]);

        $payload['banner'] = [
            'enabled'    => true,
            'title'      => str_repeat('a', 256),
            'message'    => str_repeat('a', 501),
            'link'       => 'test',
            'link_style' => 'test',
            'icon'       => 'test-test',
            'color'      => 'test-test',
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
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // inputs lower than allowed minimum
        $this->actingAs($this->user)->putJson(
            route('api.v1.application.update'),
            [
                'name'                           => 'test',
                'favicon'                        => '/storage/image/favicon.ico',
                'logo'                           => '/storage/image/testfile.svg',
                'pagination_page_size'           => '0',
                'own_rooms_pagination_page_size' => '0',
                'room_limit'                     => '-2',
                'banner'                         => ['enabled' => false],
                'statistics'                     => [
                    'servers' => [
                        'enabled'           => true,
                        'retention_period'  => 0
                    ],
                    'meetings' => [
                        'enabled'           => true,
                        'retention_period'  => 0
                    ]
                ],
                'attendance' => [
                    'enabled'           => true,
                    'retention_period'  => 0
                ],
                'room_auto_delete' => [
                    'enabled'              => true,
                    'inactive_period'      => 1,
                    'never_used_period'    => 1,
                    'deadline_period'      => 1,
                ]
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'own_rooms_pagination_page_size',
                'room_limit',
                'statistics.servers.retention_period',
                'statistics.meetings.retention_period',
                'attendance.retention_period',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',
            ]);

        // inputs higher than allowed minimum
        $this->putJson(
            route('api.v1.application.update'),
            [
                'name'                           => 'test',
                'favicon'                        => '/storage/image/favicon.ico',
                'logo'                           => '/storage/image/testfile.svg',
                'pagination_page_size'           => '101',
                'own_rooms_pagination_page_size' => '26',
                'room_limit'                     => '101',
                'banner'                         => ['enabled' => false],
                'statistics'                     => [
                    'servers' => [
                        'enabled'           => true,
                        'retention_period'  => 366
                    ],
                    'meetings' => [
                        'enabled'           => true,
                        'retention_period'  => 366
                    ]
                ],
                'attendance' => [
                    'enabled'           => true,
                    'retention_period'  => 366
                ],
                'room_auto_delete' => [
                    'enabled'              => true,
                    'inactive_period'      => 1000,
                    'never_used_period'    => 1000,
                    'deadline_period'      => 365,
                ]
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'own_rooms_pagination_page_size',
                'room_limit',
                'statistics.servers.retention_period',
                'statistics.meetings.retention_period',
                'attendance.retention_period',
                'room_auto_delete.inactive_period',
                'room_auto_delete.never_used_period',
                'room_auto_delete.deadline_period',
            ]);
    }

    public function testApplicationSettingsDefaultPresentation()
    {
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        config(['bigbluebutton.allowed_file_mimes' => 'pdf,jpg']);
        config(['bigbluebutton.max_filesize' => 5]);

        $request = [
            'name'                           => 'test',
            'favicon'                        => '/storage/image/favicon.ico',
            'logo'                           => '/storage/image/testfile.svg',
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'default_presentation'           => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => true,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => true,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        // Invalid mime
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'default_presentation'
            ]);

        // Too big file
        $request['default_presentation'] = UploadedFile::fake()->create('favicon.ico', 6000, 'image/x-icon');
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'default_presentation'
            ]);

        // Not a file
        $request['default_presentation'] = 'Test';
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'default_presentation'
            ]);

        // Valid file
        $valid_file1                     = UploadedFile::fake()->create('default_presentation.pdf', 200, 'application/pdf');
        $request['default_presentation'] = $valid_file1;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonFragment([
                'default_presentation' => Storage::disk('public')->url('default_presentation/default.pdf')
            ]);
        Storage::disk('public')->assertExists('default_presentation/default.pdf');

        // Update old file gets deleted
        $valid_file2                     = UploadedFile::fake()->create('default_presentation.jpg', str_repeat('a', 200), 'image/jpg');
        $request['default_presentation'] = $valid_file2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonFragment([
                'default_presentation' => Storage::disk('public')->url('default_presentation/default.jpg')
            ]);
        Storage::disk('public')->assertExists('default_presentation/default.jpg');
        Storage::disk('public')->assertMissing('default_presentation/default.pdf');

        // Clear default presentation (file deleted and setting removed)
        $request['default_presentation'] = '';
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertEmpty(setting('default_presentation'));
        Storage::disk('public')->assertMissing('default_presentation/default.jpg');
    }

    /**
     * Test to update the custom bbb style sheet
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function testApplicationSettingsBBBStyle()
    {
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $style =  UploadedFile::fake()->create('style.css');
        file_put_contents($style->getRealPath(), 'body { background-color: #273035; }');

        $request = [
            'bbb' => [
                'style' => $style,
            ],
            'name'                           => 'test',
            'favicon'                        => '/storage/image/favicon.ico',
            'logo'                           => '/storage/image/testfile.svg',
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => true,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => true,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.style', Storage::disk('public')->url('styles/bbb.css'));
        Storage::disk('public')->assertExists('styles/bbb.css');

        $this->assertEquals('body { background-color: #273035; }', Storage::disk('public')->get('styles/bbb.css'));

        // Update old file gets deleted
        $style2 =  UploadedFile::fake()->create('style.css');
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
        $this->assertEmpty(setting('bbb_style'));
        Storage::disk('public')->assertMissing('styles/bbb.css');
    }

    /**
     * Test to update the bbb logo
     * @throws \Illuminate\Contracts\Filesystem\FileNotFoundException
     */
    public function testApplicationSettingsBBBLogo()
    {
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $logo =  UploadedFile::fake()->create('logo.png');

        $request = [
            'bbb' => [
                'logo_file' => $logo,
            ],
            'name'                           => 'test',
            'favicon'                        => '/storage/image/favicon.ico',
            'logo'                           => '/storage/image/testfile.svg',
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => '1',
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => true,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => true,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.logo', setting('bbb_logo'));

        $path = setting('bbb_logo');

        // Update logo
        $logo2                       =  UploadedFile::fake()->create('logo.png');
        $request['bbb']['logo_file'] = $logo2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonPath('data.bbb.logo', setting('bbb_logo'));
        $this->assertNotEquals($path, setting('bbb_logo'));

        // Clear logo
        unset($request['bbb']['logo_file']);
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertEmpty(setting('bbb_logo'));
    }

    /**
     * Test if the attendance recording is getting disabled for a running meeting and attendance data removed, if the global setting is changed
     * After the global setting is disabled new attendees would not see a warning, but are recorded if this global setting is re-enabled during the meeting
     * To prevent this, the attendance recording is disabled until the end of the meeting
     */
    public function testRecordAttendanceIsDisabledForRunningMeetings()
    {
        // Enable attendance record
        setting(['attendance.enabled'=>true]);

        // Create two fake meetings
        $meetingRunning = Meeting::factory()->create(['end'=>null,'record_attendance'=>true]);
        $meetingEnded   = Meeting::factory()->create(['record_attendance'=>true]);

        $meetingRunning->attendees()->save(new MeetingAttendee(['name'=>'Marie Walker','session_id'=>'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb','join'=>'2020-01-01 08:13:11','leave'=>'2020-01-01 08:15:51']));

        // Payload to disable attendance recording
        $payload = [
            'name'                           => 'test',
            'logo_file'                      => UploadedFile::fake()->image('logo.svg'),
            'favicon_file'                   => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => false,
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 14,
                'never_used_period'    => 30,
                'deadline_period'      => 7
            ]
        ];

        // Add necessary role and permission to user to update application settings
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Update global settings
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();

        // Check if record attendance was disabled for running meetings
        $meetingRunning->refresh();
        $meetingEnded->refresh();
        $this->assertFalse($meetingRunning->record_attendance);
        $this->assertTrue($meetingEnded->record_attendance);

        // Check if all attendance data is removed
        $this->assertCount(0, $meetingRunning->attendees);
    }

    /**
     * Test if auto room deletion is disabled if booth time periods are disabled
     */
    public function testRoomDeletionDisabled()
    {
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Payload with booth time periods disabled
        $payload = [
            'name'                           => 'test',
            'logo_file'                      => UploadedFile::fake()->image('logo.svg'),
            'favicon_file'                   => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => false,
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => -1,
                'never_used_period'    => -1,
                'deadline_period'      => 7
            ]
        ];

        // Update global settings and check result
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful()
            ->assertJsonPath('data.room_auto_delete.enabled', false);

        // Payload with only one time period disabled
        $payload = [
            'name'                           => 'test',
            'logo_file'                      => UploadedFile::fake()->image('logo.svg'),
            'favicon_file'                   => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon'),
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
            'banner'                         => ['enabled' => false],
            'password_self_reset_enabled'    => false,
            'default_timezone'               => 'Europe/Berlin',
            'room_token_expiration'          => -1,
            'statistics'                     => [
                'servers' => [
                    'enabled'           => false,
                    'retention_period'  => 7
                ],
                'meetings' => [
                    'enabled'           => true,
                    'retention_period'  => 90
                ]
            ],
            'attendance' => [
                'enabled'           => false,
                'retention_period'  => 14
            ],
            'room_auto_delete' => [
                'enabled'              => true,
                'inactive_period'      => 7,
                'never_used_period'    => -1,
                'deadline_period'      => 7
            ]
        ];

        // Update global settings and check result
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful()
            ->assertJsonPath('data.room_auto_delete.enabled', true);
    }
}
