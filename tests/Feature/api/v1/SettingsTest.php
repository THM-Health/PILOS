<?php

namespace Tests\Feature\api\v1;

use App\Meeting;
use App\MeetingAttendee;
use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
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
        setting(['room_token_expiration' => -1]);

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
                    'help_url'   => 'http://localhost',
                    'statistics' => [
                        'meetings' => [
                            'enabled'           => true,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => false,
                        'retention_period'  => 14
                    ],
                    'room_token_expiration' => -1
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
                    'help_url'   => null,
                    'statistics' => [
                        'meetings' => [
                            'enabled'           => false,
                            'retention_period'  => 90
                        ]
                    ],
                    'attendance' => [
                        'enabled'           => true,
                        'retention_period'  => 14
                    ],
                    'room_token_expiration' => 100
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

        $this->getJson(route('api.v1.application.complete'))->assertUnauthorized();
        $this->actingAs($this->user)->getJson(route('api.v1.application.complete'))->assertForbidden();

        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->getJson(route('api.v1.application.complete'))
            ->assertJson([
                'data' => [
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
                    ]
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
                    ]
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
                    ]
                ]
            ]);
        $this->assertTrue(setting()->has('help_url'));
        $this->assertEquals('http://localhost', setting('help_url'));

        $payload['help_url'] = '';

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();

        $this->assertFalse(setting()->has('help_url'));
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
            ]
        ];

        // Add necessary role and permission to user to update application settings
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $response = $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload);
        $response->assertSuccessful();

        $this->assertFalse($response->json('data.logo') == '/storage/image/testfile.svg');
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
            'pagination_page_size'           => 'notnumber',
            'own_rooms_pagination_page_size' => 'notnumber',
            'room_limit'                     => 'notnumber',
            'password_self_reset_enabled'    => 'foo',
            'default_timezone'               => 'timezone',
            'help_url'                       => 33,
            'room_token_expiration'          => 'foo',
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
                'statistics.servers.enabled',
                'statistics.servers.retention_period',
                'statistics.meetings.enabled',
                'statistics.meetings.retention_period',
                'attendance.enabled',
                'attendance.retention_period',
                'room_token_expiration'
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
                'help_url'
            ]);

        $payload['banner'] = [
            'enabled' => 'foo'
        ];
        $payload['room_token_expiration'] = 1000;
        $payload['help_url'] = '';

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.enabled'
            ])
            ->assertJsonMissingValidationErrors([
                'help_url',
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
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'),
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
                'attendance.retention_period'
            ]);

        // inputs higher than allowed minimum
        $this->putJson(route('api.v1.application.update'),
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
                'attendance.retention_period'
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
}
