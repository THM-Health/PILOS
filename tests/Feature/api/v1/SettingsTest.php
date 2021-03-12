<?php

namespace Tests\Feature\api\v1;

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
        $this->user = factory(User::class)->create();
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

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                    'banner'                         => [
                        'enabled'    => false
                    ]
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

        $this->getJson(route('api.v1.application.complete'))->assertUnauthorized();
        $this->actingAs($this->user)->getJson(route('api.v1.application.complete'))->assertForbidden();

        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.viewAny']);
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
            'default_timezone'            => 'Europe/Berlin'
        ];

        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
                    'default_timezone'            => 'Europe/Berlin'
                ]
            ]);
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
            'default_timezone'               => 'Europe/Berlin'
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
            'default_timezone'               => 'Europe/Berlin'
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
            'default_timezone'               => 'Europe/Berlin'
        ];

        // Add necessary role and permission to user to update application settings
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
            'default_timezone'               => 'timezone'
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
                'default_timezone'
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
            'default_timezone'               => 'Europe/Berlin'
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner',
                'banner.enabled'
            ]);

        $payload['banner'] = [
            'enabled' => 'foo'
        ];

        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'banner.enabled'
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
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
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
                'banner'                         => ['enabled' => false]
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'own_rooms_pagination_page_size',
                'room_limit'
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
                'banner'                         => ['enabled' => false]
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'pagination_page_size',
                'own_rooms_pagination_page_size',
                'room_limit'
            ]);
    }

    public function testApplicationSettingsDefaultPresentation()
    {
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'applicationSettings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        config(['bigbluebutton.allowed_file_mimes' => 'pdf']);
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
            'default_presentation'           => UploadedFile::fake()->create('favicon.ico', 100, 'image/x-icon')
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
        $valid_file1                     = UploadedFile::fake()->create('default_presentation.pdf', 200);
        $request['default_presentation'] = $valid_file1;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonFragment([
                'default_presentation' => Storage::disk('public')->url('default_presentation/' . $valid_file1->hashName())
            ]);

        // Update old file gets deleted
        $valid_file2                     = UploadedFile::fake()->create('default_presentation.pdf', str_repeat('a', 200), 'application/pdf');
        $request['default_presentation'] = $valid_file2;
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertStatus(200)
            ->assertJsonFragment([
                'default_presentation' => Storage::disk('public')->url('default_presentation/' . $valid_file2->hashName())
            ]);
        Storage::disk('public')->assertExists('default_presentation/' . $valid_file2->hashName());
        Storage::disk('public')->assertMissing('default_presentation/' . $valid_file1->hashName());

        // Clear default presentation (file deleted and setting removed)
        $request['default_presentation'] = '';
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $request)
            ->assertSuccessful();
        $this->assertEmpty(setting('default_presentation'));
        Storage::disk('public')->assertMissing('default_presentation/' . $valid_file1->hashName());
    }
}
