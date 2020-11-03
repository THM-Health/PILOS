<?php

namespace Tests\Feature\api\v1;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

        $this->getJson(route('api.v1.application'))
            ->assertJson([
                'data' => [
                    'logo'                           => 'testlogo.svg',
                    'pagination_page_size'           => '123',
                    'own_rooms_pagination_page_size' => '123',
                    'room_limit'                     => '-1',
                ]
            ])
            ->assertSuccessful();
    }

    /**
     * Tests that updates application settings with valid inputs
     *
     * @return void
     */
    public function testUpdateApplicationSettingsWithValidInputs()
    {
        $imageFile = UploadedFile::fake()->image('logo.svg');

        $payload = [
            'logo_file'                      => $imageFile,
            'pagination_page_size'           => '10',
            'own_rooms_pagination_page_size' => '15',
            'room_limit'                     => '-1',
        ];

        // Unauthorized Test
        $this->putJson(route('api.v1.application.update'), $payload)
            ->assertUnauthorized();

        // Forbidden Test
        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertForbidden();

        // Add necessary role and permission to user to update application settings
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'settings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'), $payload)
            ->assertSuccessful();
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
        $permission = factory(Permission::class)->create(['name' => 'settings.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $this->actingAs($this->user)->putJson(route('api.v1.application.update'),
            [
                'logo'                           => '',
                'pagination_page_size'           => 'notnumber',
                'own_rooms_pagination_page_size' => 'notnumber',
                'room_limit'                     => 'notnumber',
            ]
        )
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'logo',
                'pagination_page_size',
                'own_rooms_pagination_page_size',
                'room_limit'
            ]);
    }
}
