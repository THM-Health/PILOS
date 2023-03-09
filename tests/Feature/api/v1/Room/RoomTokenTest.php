<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomToken;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoomTokenTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $room;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
        $this->room = Room::factory()->create();
    }

    public function testIndex()
    {
        setting(['room_token_expiration' => 90]);

        RoomToken::query()->delete();
        RoomToken::factory()->count(10)->create([
            'room_id' => $this->room
        ]);
        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $this->room,
            'role'    => RoomUserRole::MODERATOR
        ]);

        RoomToken::factory()->count(10)->create();

        // Guest
        $this->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertUnauthorized();

        // Moderator through token
        $this->withHeaders(['Token' => $moderatorToken->token])
            ->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertUnauthorized();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id =>  ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id =>  ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires'
                ]
            ]])
            ->assertJsonCount(11, 'data');

        // Testing owner
        $this->actingAs($this->room->owner)->getJson(route('api.v1.rooms.tokens.get', ['room' => 1337]))
            ->assertNotFound();

        $this->actingAs($this->room->owner)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires'
                ]
            ]])
            ->assertJsonCount(11, 'data');

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['name' => 'admin', 'default' => true])->first());
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires'
                ]
            ]])
            ->assertJsonCount(11, 'data');

        // Check expire date
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))->json('data');
        $token   = RoomToken::find($results[0]['token']);
        self::assertEquals($token->created_at->addMinutes(90)->toISOString(), $results[0]['expires']);

        setting(['room_token_expiration' => -1]);
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.tokens.get', ['room' => $this->room]))->json('data');
        self::assertNull($results[0]['expires']);
    }

    public function testCreate()
    {
        RoomToken::query()->delete();
        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $this->room,
            'role'    => RoomUserRole::MODERATOR
        ]);
        $payload = [
            'firstname' => 1,
            'lastname'  => 1,
            'role'      => 'test'
        ];

        // Create as guest
        $this->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertUnauthorized();

        // Create as guest with moderator token
        $this->withHeaders(['Token' => $moderatorToken->token])
            ->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertUnauthorized();

        // Create as moderator
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.tokens.add', ['room' => 1337]), $payload)
            ->assertNotFound();
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertForbidden();

        // Create as co-owner invalid data
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertJsonValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);

        // Create as co-owner valid data
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname'  => $this->faker->lastName,
            'role'      => RoomUserRole::USER
        ];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);

        // Create as owner
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);

        // Create with viewAllPermission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['name' => 'admin', 'default' => true])->first());
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.tokens.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);
    }

    public function testUpdate()
    {
        RoomToken::query()->delete();
        $otherRoom = Room::factory()->create();

        $token = RoomToken::factory()->create([
            'room_id' => $this->room,
            'role'    => RoomUserRole::MODERATOR
        ]);
        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $this->room,
            'role'    => RoomUserRole::MODERATOR
        ]);
        $payload = [
            'firstname' => 1,
            'lastname'  => 1,
            'role'      => 'test'
        ];

        // Update as guest
        $this->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertUnauthorized();

        // Update as guest with moderator token
        $this->withHeaders(['Token' => $moderatorToken->token])
            ->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertUnauthorized();

        // Update as moderator
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => 1337, 'token' => $token]), $payload)
            ->assertNotFound();
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertForbidden();

        // Update as co-owner invalid data
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertJsonValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);

        // Update as co-owner valid data
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname'  => $this->faker->lastName,
            'role'      => RoomUserRole::USER
        ];
        $response = $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);
        $token = RoomToken::find($response['data']['token']);

        // Update as owner
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname'  => $this->faker->lastName,
            'role'      => RoomUserRole::USER
        ];
        $response = $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);
        $token = RoomToken::find($response['data']['token']);

        // Update with viewAllPermission
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname'  => $this->faker->lastName,
            'role'      => RoomUserRole::USER
        ];
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['name' => 'admin', 'default' => true])->first());
        $response = $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => $this->room, 'token' => $token]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role'
            ]);

        // Check trying to update with wrong room id
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.tokens.update', ['room' => $otherRoom, 'token' => $token]), $payload)
            ->assertNotFound();
    }

    public function testDelete()
    {
        $otherRoom = Room::factory()->create();
        RoomToken::query()->delete();
        $token = RoomToken::factory()->create([
            'room_id' => $this->room
        ]);
        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $this->room,
            'role'    => RoomUserRole::MODERATOR
        ]);

        // Delete as guest
        $this->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertUnauthorized();

        // Delete as guest with moderator token
        $this->withHeaders(['Token' => $moderatorToken->token])
            ->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertUnauthorized();

        // Delete as moderator
        $this->room->members()->sync([$this->user->id =>['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertForbidden();

        // Delete as co-owner
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertSuccessful();

        // Delete not existing
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertNotFound();

        // Delete as owner
        $token = RoomToken::factory()->create([
            'room_id' => $this->room
        ]);
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertSuccessful();
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertNotFound();

        // Delete with viewAllPermission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['name' => 'admin', 'default' => true])->first());
        $token = RoomToken::factory()->create([
            'room_id' => $this->room
        ]);

        // Check trying to delete with wrong room id
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.update', ['room' => $otherRoom, 'token' => $token]))
            ->assertNotFound();

        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertSuccessful();
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.tokens.destroy', ['room' => $this->room, 'token' => $token]))
            ->assertNotFound();
    }
}
