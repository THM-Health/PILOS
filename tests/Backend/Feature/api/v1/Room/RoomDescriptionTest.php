<?php

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

/**
 * General room api feature tests
 */
class RoomDescriptionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $role;

    protected $createPermission;

    protected $managePermission;

    protected $viewAllPermission;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role = Role::factory()->create();
        $this->viewAllPermission = Permission::where('name', 'rooms.viewAll')->first();
    }

    public function test_read_description_private_room()
    {
        $description = $this->faker->text(1000);

        $room = Room::factory()->create(['description' => $description, 'allow_guests' => true]);

        // Test anoymous user
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);

        // Test regular user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
    }

    public function test_read_description_public_room_with_code()
    {
        $description = $this->faker->text(1000);

        $room = Room::factory()->create(['description' => $description, 'allow_guests' => true, 'access_code' => $this->faker->numberBetween(111111111, 999999999)]);

        // Test anoymous user without access code
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonMissingPath('data.description');

        // Test anoymous user with access code
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $this->flushHeaders();

        // Test regular user without access code
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonMissingPath('data.description');

        // Test regular user with access code
        $this->withHeaders(['Access-Code' => $room->access_code])->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $this->flushHeaders();

        // Test room member without access code
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $room->members()->detach($this->user);

        // Test room moderator without access code
        $room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $room->members()->detach($this->user);

        // Test room co-owner without access code
        $room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $room->members()->detach($this->user);

        // Test room as user with view all rooms permission without access code
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
        $this->user->roles()->detach($this->role);

        // Test room owner without access code
        $room->owner()->associate($this->user);
        $room->save();
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
    }

    public function test_read_description_internal_room()
    {
        $description = $this->faker->text(1000);

        $room = Room::factory()->create(['description' => $description, 'allow_guests' => false]);

        // Test anoymous user
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(403);

        // Test regular user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'description' => $room->description,
                ],
            ]);
    }

    public function test_update_description_permissions()
    {
        $room = Room::factory()->create(['allow_guests' => true]);
        $description = $this->faker->text(1000);

        // Test anoymous user
        $this->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(401);

        // Test regular user
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(403);

        // Test room member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(403);
        $room->members()->detach($this->user);

        // Test room moderator
        $room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(403);
        $room->members()->detach($this->user);

        // Test room co-owner
        $room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(204);
        $room->refresh();
        $this->assertEquals($description, $room->description);
        $room->description = null;
        $room->save();
        $room->members()->detach($this->user);

        // Test room as user with view all rooms permission
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(403);
        $this->role->permissions()->detach($this->viewAllPermission);
        $this->user->roles()->detach($this->role);

        // Test room as user with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(403);
        $this->role->permissions()->detach($this->managePermission);
        $this->user->roles()->detach($this->role);

        // Test room owner
        $room->owner()->associate($this->user);
        $room->save();
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(204);
        $room->refresh();

        $this->assertEquals($description, $room->description);
    }

    public function test_update_description_data()
    {
        $room = Room::factory()->create();
        $room->owner()->associate($this->user);
        $room->save();

        $description = $this->faker->text(1000);

        // Set description
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $description])
            ->assertStatus(204);
        $room->refresh();
        $this->assertEquals($description, $room->description);

        // Remove description
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => null])
            ->assertStatus(204);
        $room->refresh();
        $this->assertNull($room->description);

        // Set description to empty paragraph
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => '<p></p>'])
            ->assertStatus(204);
        $room->refresh();
        $this->assertNull($room->description);

        // Too long description
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.description.update', ['room' => $room]), ['description' => $this->faker->text(650001)])
            ->assertUnprocessable();
        $room->refresh();
        $this->assertNull($room->description);
    }
}
