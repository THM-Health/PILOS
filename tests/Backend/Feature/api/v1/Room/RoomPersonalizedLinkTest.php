<?php

declare(strict_types=1);

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\RoomAuthTokenType;
use App\Enums\RoomUserRole;
use App\Enums\TimePeriod;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Models\RoomPersonalizedLink;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\SessionHelpers;

class RoomPersonalizedLinkTest extends TestCase
{
    use RefreshDatabase, SessionHelpers, WithFaker;

    protected $user;

    protected $room;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
        $this->room = Room::factory()->create();
    }

    public function test_index()
    {
        $this->roomSettings->personalized_link_expiration = TimePeriod::THREE_MONTHS;
        $this->roomSettings->save();

        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        RoomPersonalizedLink::factory()->create(['firstname' => 'John', 'lastname' => 'Doe', 'role' => RoomUserRole::USER, 'last_usage' => '2024-04-01 08:00', 'room_id' => $this->room]);
        RoomPersonalizedLink::factory()->create(['firstname' => 'Daniel', 'lastname' => 'Osorio', 'role' => RoomUserRole::USER, 'last_usage' => '2024-04-01 09:00', 'room_id' => $this->room]);
        RoomPersonalizedLink::factory()->create(['firstname' => 'Angela', 'lastname' => 'Jones', 'role' => RoomUserRole::USER, 'last_usage' => null, 'room_id' => $this->room]);
        RoomPersonalizedLink::factory()->create(['firstname' => 'Thomas', 'lastname' => 'Bolden', 'role' => RoomUserRole::USER, 'last_usage' => '2024-04-01 10:00', 'room_id' => $this->room]);
        RoomPersonalizedLink::factory()->create(['firstname' => 'Hoyt', 'lastname' => 'Hastings', 'role' => RoomUserRole::MODERATOR, 'last_usage' => '2024-04-01 11:00', 'room_id' => $this->room]);
        $moderatorLink = RoomPersonalizedLink::factory()->create(['firstname' => 'William', 'lastname' => 'White', 'role' => RoomUserRole::MODERATOR, 'last_usage' => null, 'room_id' => $this->room]);

        RoomPersonalizedLink::factory()->count(10)->create();

        // Guest
        $this->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Moderator through personalized link
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'room_personalized_link_id' => $moderatorLink->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
        ]);

        $this->getJson(route('api.v1.rooms.personalizedLinks.get', [
            'room' => $this->room,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'id',
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires',
                ],
            ]])
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 6);

        // Testing owner
        $this->actingAs($this->room->owner)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => 1337]))
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room',
                'ids' => [1337],
            ]);

        $this->actingAs($this->room->owner)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'id',
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires',
                ],
            ]])
            ->assertJsonCount(5, 'data');

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['superuser' => true])->first());
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonStructure(['data' => [
                '*' => [
                    'id',
                    'token',
                    'firstname',
                    'lastname',
                    'role',
                    'expires',
                ],
            ]])
            ->assertJsonCount(5, 'data');

        // Check expire date
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))->json('data');
        $link = RoomPersonalizedLink::find($results[0]['id']);
        self::assertEquals($link->created_at->addDays(90)->toISOString(), $results[0]['expires']);

        $this->roomSettings->personalized_link_expiration = TimePeriod::UNLIMITED;
        $this->roomSettings->save();
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))->json('data');
        self::assertNull($results[0]['expires']);

        // Check default sorting / fallback (firstname asc)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room]))
            ->assertJsonPath('data.0.firstname', 'Angela')
            ->assertJsonPath('data.1.firstname', 'Daniel')
            ->assertJsonPath('data.2.firstname', 'Hoyt')
            ->assertJsonPath('data.3.firstname', 'John')
            ->assertJsonPath('data.4.firstname', 'Thomas');

        // Check sorting by firstname desc
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'sort_by' => 'firstname', 'sort_direction' => 'desc']))
            ->assertJsonPath('data.0.firstname', 'William')
            ->assertJsonPath('data.1.firstname', 'Thomas')
            ->assertJsonPath('data.2.firstname', 'John')
            ->assertJsonPath('data.3.firstname', 'Hoyt')
            ->assertJsonPath('data.4.firstname', 'Daniel');

        // Check sorting by lastname asc
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'sort_by' => 'lastname', 'sort_direction' => 'asc']))
            ->assertJsonPath('data.0.lastname', 'Bolden')
            ->assertJsonPath('data.1.lastname', 'Doe')
            ->assertJsonPath('data.2.lastname', 'Hastings')
            ->assertJsonPath('data.3.lastname', 'Jones')
            ->assertJsonPath('data.4.lastname', 'Osorio');

        // Check sorting by last_usage desc
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'sort_by' => 'last_usage', 'sort_direction' => 'desc']))
            ->assertJsonPath('data.0.firstname', 'Hoyt')
            ->assertJsonPath('data.1.firstname', 'Thomas')
            ->assertJsonPath('data.2.firstname', 'Daniel')
            ->assertJsonPath('data.3.firstname', 'John');

        // Check search
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'query' => 'Jo']))
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.firstname', 'Angela')
            ->assertJsonPath('data.1.firstname', 'John')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check search; empty is ignored, no filtering
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'query' => '']))
            ->assertSuccessful()
            ->assertJsonPath('meta.total', 6);

        // Check search with whitespaces (all should match in first or last name)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'query' => 'John Doe']))
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.firstname', 'John')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by role (participant_role)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'filter' => 'participant_role']))
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by role (moderator_role)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'filter' => 'moderator_role']))
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by invalid role
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.personalizedLinks.get', ['room' => $this->room, 'filter' => 'invalid_role']))
            ->assertJsonValidationErrors(['filter']);
    }

    public function test_create()
    {
        RoomPersonalizedLink::query()->delete();
        $moderatorLink = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
            'role' => RoomUserRole::MODERATOR,
        ]);
        $payload = [
            'firstname' => 1,
            'lastname' => 1,
            'role' => 'test',
        ];

        // Create as guest
        $this->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Create as guest with moderator link
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'room_personalized_link_id' => $moderatorLink->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
        ]);

        $this->postJson(route('api.v1.rooms.personalizedLinks.add', [
            'room' => $this->room,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]), $payload)
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Create as moderator
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => 1337]), $payload)
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room',
                    'ids' => [1337],
                ]
            );
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertForbidden();

        // Create as co-owner invalid data
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertJsonValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);

        // Create as co-owner valid data
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname' => $this->faker->lastName,
            'role' => RoomUserRole::USER,
        ];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);

        // Create as owner
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);

        // Create with viewAllPermission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['superuser' => true])->first());
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.personalizedLinks.add', ['room' => $this->room]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);
    }

    public function test_update()
    {
        RoomPersonalizedLink::query()->delete();
        $otherRoom = Room::factory()->create();

        $link = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
            'role' => RoomUserRole::MODERATOR,
        ]);
        $moderatorLink = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
            'role' => RoomUserRole::MODERATOR,
        ]);
        $payload = [
            'firstname' => 1,
            'lastname' => 1,
            'role' => 'test',
        ];

        // Update as guest
        $this->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Update as guest with moderator link
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'room_personalized_link_id' => $moderatorLink->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
        ]);

        $this->putJson(route('api.v1.rooms.personalizedLinks.update', [
            'room' => $this->room,
            'personalizedLink' => $link,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]), $payload)
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Update as moderator
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => 1337, 'personalizedLink' => $link]), $payload)
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room',
                    'ids' => [1337],
                ]);

        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertForbidden();

        // Update as co-owner invalid data
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertJsonValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);

        // Update as co-owner valid data
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname' => $this->faker->lastName,
            'role' => RoomUserRole::USER,
        ];
        $response = $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);
        $link = RoomPersonalizedLink::find($response['data']['id']);

        // Update as owner
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname' => $this->faker->lastName,
            'role' => RoomUserRole::USER,
        ];
        $response = $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);
        $link = RoomPersonalizedLink::find($response['data']['id']);

        // Update with viewAllPermission
        $payload = [
            'firstname' => $this->faker->firstName,
            'lastname' => $this->faker->lastName,
            'role' => RoomUserRole::USER,
        ];
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['superuser' => true])->first());
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertSuccessful()
            ->assertJsonMissingValidationErrors([
                'firstname',
                'lastname',
                'role',
            ]);

        // Check trying to update with wrong room id
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $otherRoom, 'personalizedLink' => $link]), $payload)
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);

        // Test deleted
        $link->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);

        // Test deleted room
        $this->room->delete();

        $this->actingAs($this->user)->putJson(route('api.v1.rooms.personalizedLinks.update', ['room' => $this->room, 'personalizedLink' => $link]), $payload)
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room',
                    'ids' => [$this->room->id],
                ]);
    }

    public function test_delete()
    {
        $otherRoom = Room::factory()->create();
        RoomPersonalizedLink::query()->delete();
        $link = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
        ]);
        $moderatorLink = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
            'role' => RoomUserRole::MODERATOR,
        ]);

        // Delete as guest
        $this->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Delete as guest with moderator link
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'room_personalized_link_id' => $moderatorLink->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
        ]);

        $this->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', [
            'room' => $this->room,
            'personalizedLink' => $link,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Unauthenticated.']);

        // Delete as moderator
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertForbidden();

        // Delete as co-owner
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertSuccessful();

        // Delete not existing
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);

        // Delete as owner
        $link = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
        ]);
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertSuccessful();
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);

        // Delete with viewAllPermission
        $this->room->members()->sync([]);
        $this->user->roles()->attach(Role::where(['superuser' => true])->first());
        $link = RoomPersonalizedLink::factory()->create([
            'room_id' => $this->room,
        ]);

        // Check trying to delete with wrong room id
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $otherRoom, 'personalizedLink' => $link]))
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);

        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.personalizedLinks.destroy', ['room' => $this->room, 'personalizedLink' => $link]))
            ->assertNotFound()
            ->assertJson(
                [
                    'message' => 'model_not_found',
                    'model' => 'room_personalized_link',
                    'ids' => [$link->id],
                ]);
    }
}
