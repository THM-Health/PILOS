<?php

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class MembershipTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $role;

    protected $managePermission;

    protected $viewAllPermission;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->role = Role::factory()->create();

        $this->managePermission = Permission::factory()->create(['name' => 'rooms.manage']);
        $this->viewAllPermission = Permission::factory()->create(['name' => 'rooms.viewAll']);
    }

    public function test_access_code_membership()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'expert_mode' => true,
            'allow_membership' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allow_membership' => true]);

        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => false]);
    }

    public function test_join_membership()
    {
        //Room types
        $roomTypeAllowMembershipEnforced = RoomType::factory()->create([
            'allow_membership_default' => true,
            'allow_membership_enforced' => true,
        ]);

        $roomTypeNoMembershipAllowedEnforced = RoomType::factory()->create([
            'allow_membership_default' => false,
            'allow_membership_enforced' => true,
        ]);

        $roomTypeAllowMembershipDefault = RoomType::factory()->create([
            'allow_membership_default' => true,
            'allow_membership_enforced' => false,
        ]);

        $roomTypeNoMembershipAllowedDefault = RoomType::factory()->create([
            'allow_membership_default' => false,
            'allow_membership_enforced' => false,
        ]);

        // Rooms
        $roomAllowMembershipEnforced1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipEnforced->id,
        ]);

        $roomAllowMembershipEnforced2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipEnforced->id,
        ]);

        $roomAllowMembershipEnforced3 = Room::factory()->create([
            'expert_mode' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipEnforced->id,
        ]);

        $roomAllowMembershipDefault = Room::factory()->create([
            'expert_mode' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipDefault->id,
        ]);

        $roomAllowMembershipExpert1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedDefault->id,
        ]);

        $roomAllowMembershipExpert2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipDefault->id,
        ]);

        $roomNoMembershipAllowedEnforced1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedEnforced->id,
        ]);

        $roomNoMembershipAllowedEnforced2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedEnforced->id,
        ]);

        $roomNoMembershipAllowedEnforced3 = Room::factory()->create([
            'expert_mode' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedEnforced->id,
        ]);

        $roomNoMembershipAllowedDefault = Room::factory()->create([
            'expert_mode' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedDefault->id,
        ]);

        $roomNoMembershipAllowedExpert1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeAllowMembershipDefault->id,
        ]);

        $roomNoMembershipAllowedExpert2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_membership' => false,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'room_type_id' => $roomTypeNoMembershipAllowedDefault->id,
        ]);

        // Test rooms where joining membership is not allowed
        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedEnforced1->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedEnforced1]))
            ->assertForbidden();

        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedEnforced2->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedEnforced2]))
            ->assertForbidden();

        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedEnforced3->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedEnforced3]))
            ->assertForbidden();

        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedDefault->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedDefault]))
            ->assertForbidden();

        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedExpert1->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedExpert1]))
            ->assertForbidden();

        $this->withHeaders(['Access-Code' => $roomNoMembershipAllowedExpert2->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomNoMembershipAllowedExpert2]))
            ->assertForbidden();

        // Test rooms where joining membership is allowed

        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced1->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipEnforced1]))
            ->assertNoContent();

        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced2->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipEnforced2]))
            ->assertNoContent();

        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced3->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipEnforced3]))
            ->assertNoContent();

        $this->withHeaders(['Access-Code' => $roomAllowMembershipDefault->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipDefault]))
            ->assertNoContent();

        $this->withHeaders(['Access-Code' => $roomAllowMembershipExpert1->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipExpert1]))
            ->assertNoContent();

        $this->withHeaders(['Access-Code' => $roomAllowMembershipExpert2->access_code])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room' => $roomAllowMembershipExpert2]))
            ->assertNoContent();

        // Try to get room details with access code even not needed
        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced1->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced1]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced2->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced2]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->withHeaders(['Access-Code' => $roomAllowMembershipEnforced3->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced3]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->withHeaders(['Access-Code' => $roomAllowMembershipDefault->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipDefault]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->withHeaders(['Access-Code' => $roomAllowMembershipExpert1->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipExpert1]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->withHeaders(['Access-Code' => $roomAllowMembershipExpert2->access_code])->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipExpert2]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        // Try to get room details without access code, because members don't need it
        $this->flushHeaders();

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced1]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced2]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipEnforced3]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipDefault]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipExpert1]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room' => $roomAllowMembershipExpert2]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => true]);
    }

    public function test_leave_membership()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'allow_membership' => true,
            'expert_mode' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);

        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.membership.leave', ['room' => $room]))
            ->assertNoContent();
        // Check membership is removed
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allow_membership' => true, 'is_member' => false]);
        // Try to get room details without access code
        $this->flushHeaders();
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allow_membership' => true, 'is_member' => false]);
    }

    /**
     * Test list of room members for required permissions and response content
     */
    public function test_member_list()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        $john = User::factory()->create(['firstname' => 'John', 'lastname' => 'Doe', 'image' => 'test.jpg']);
        $daniel = User::factory()->create(['firstname' => 'Daniel', 'lastname' => 'Osorio']);
        $angela = User::factory()->create(['firstname' => 'Angela', 'lastname' => 'Jones']);
        $hoyt = User::factory()->create(['firstname' => 'Hoyt', 'lastname' => 'Hastings']);
        $william = User::factory()->create(['firstname' => 'William', 'lastname' => 'White']);
        $thomas = User::factory()->create(['firstname' => 'Thomas', 'lastname' => 'Bolden']);

        $room->members()->attach($john, ['role' => RoomUserRole::USER]);
        $room->members()->attach($daniel, ['role' => RoomUserRole::USER]);
        $room->members()->attach($angela, ['role' => RoomUserRole::USER]);
        $room->members()->attach($hoyt, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($thomas, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($william, ['role' => RoomUserRole::CO_OWNER]);

        // Check member list as guest
        $this->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertUnauthorized();

        // Check member list as user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertForbidden();

        // Check member list as member user
        $this->actingAs($john)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertForbidden();

        // Check member list as member moderator
        $this->actingAs($hoyt)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertForbidden();

        // Check member list as member co-owner
        $this->actingAs($william)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertSuccessful();

        // Check member list as owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertSuccessful();

        // Check member list with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Check member list with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        // Check response content
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonPath('data.2.firstname', 'Hoyt')
            ->assertJsonPath('data.2.lastname', 'Hastings')
            ->assertJsonPath('data.2.role', RoomUserRole::MODERATOR->value)
            ->assertJsonPath('data.2.image', null)
            ->assertJsonPath('data.3.firstname', 'John')
            ->assertJsonPath('data.3.lastname', 'Doe')
            ->assertJsonPath('data.3.role', RoomUserRole::USER->value)
            ->assertJsonPath('data.3.image', 'http://localhost/storage/test.jpg');

        // Check default sorting / fallback (firstname asc)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room]))
            ->assertJsonPath('data.0.firstname', 'Angela')
            ->assertJsonPath('data.1.firstname', 'Daniel')
            ->assertJsonPath('data.2.firstname', 'Hoyt')
            ->assertJsonPath('data.3.firstname', 'John')
            ->assertJsonPath('data.4.firstname', 'Thomas');

        // Check sorting by firstname desc
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'sort_by' => 'firstname', 'sort_direction' => 'desc']))
            ->assertJsonPath('data.0.firstname', 'William')
            ->assertJsonPath('data.1.firstname', 'Thomas')
            ->assertJsonPath('data.2.firstname', 'John')
            ->assertJsonPath('data.3.firstname', 'Hoyt')
            ->assertJsonPath('data.4.firstname', 'Daniel');

        // Check sorting by lastname asc
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'sort_by' => 'lastname', 'sort_direction' => 'asc']))
            ->assertJsonPath('data.0.lastname', 'Bolden')
            ->assertJsonPath('data.1.lastname', 'Doe')
            ->assertJsonPath('data.2.lastname', 'Hastings')
            ->assertJsonPath('data.3.lastname', 'Jones')
            ->assertJsonPath('data.4.lastname', 'Osorio');

        // Check search
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'search' => 'Jo']))
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.firstname', 'Angela')
            ->assertJsonPath('data.1.firstname', 'John')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check search with whitespaces (all should match in first or last name)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'search' => 'John Doe']))
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.firstname', 'John')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by role (participant_role)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'filter' => 'participant_role']))
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by role (moderator_role)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'filter' => 'moderator_role']))
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by role (co_owner_role)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'filter' => 'co_owner_role']))
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 6);

        // Check filter by invalid role (fallback to all)
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room' => $room, 'filter' => 'invalid_role']))
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 6);
    }

    /**
     * Test functionality room owner and co-owner adding member
     */
    public function test_add_member()
    {
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();

        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->sync([$memberUser->id => ['role' => RoomUserRole::USER], $memberModerator->id => ['role' => RoomUserRole::MODERATOR], $memberCoOwner->id => ['role' => RoomUserRole::CO_OWNER]]);

        // Add member as guest
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertUnauthorized();

        // Add member as non owner
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertForbidden();

        // Add user member add other member
        $this->actingAs($memberUser)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertForbidden();

        // Add moderator member add other member
        $this->actingAs($memberModerator)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertForbidden();

        // Add co-owner member add other member
        $this->actingAs($memberCoOwner)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member with invalid role
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => 10])
            ->assertJsonValidationErrors(['role']);

        // Add member with invalid user
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => 0, 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors(['user']);

        // Add member as user
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member as moderator
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::MODERATOR])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member as co-owner
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::CO_OWNER])
            ->assertNoContent();

        // Try to add same member again
        $this->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user');

        // Check if member is added with correct role
        $foundNewUser = $room->members()->find($newUser);
        $this->assertNotNull($foundNewUser);
        $this->assertEquals(RoomUserRole::CO_OWNER, $foundNewUser->pivot->role);

        // Reset membership
        $room->members()->detach($newUser->id);

        // Test view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room' => $room]), ['user' => $newUser->id, 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
    }

    /**
     * Test functionality room owner and co-owner removing member
     */
    public function test_remove_member()
    {
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();

        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($newUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);

        // Remove member as guest
        $this->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertUnauthorized();

        // Remove member as non owner
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertForbidden();

        // Remove member as user member
        $this->actingAs($memberUser)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertForbidden();

        // Remove member as moderator member
        $this->actingAs($memberModerator)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertForbidden();

        // Remove member as co-owner member
        $this->actingAs($memberCoOwner)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertNoContent();
        $room->members()->attach($newUser, ['role' => RoomUserRole::USER]);

        // Remove with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Remove with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
        $room->members()->attach($newUser, ['role' => RoomUserRole::USER]);

        // Remove member with invalid user
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => 0]))
            ->assertNotFound();

        // Remove member as moderator
        $this->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertNoContent();

        // Check member list
        $this->assertNull($room->members()->find($newUser));

        // Try to remove user again
        $this->deleteJson(route('api.v1.rooms.member.destroy', ['room' => $room, 'user' => $newUser]))
            ->assertStatus(410);

        // Check if user is no member
        $this->actingAs($newUser)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['is_member' => false]);
    }

    /**
     * Test functionality room owner and co-owner changing room membership role
     */
    public function test_change_member_role()
    {
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($newUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);

        // Update with wrong role
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => 10])
            ->assertJsonValidationErrors(['role']);

        // Update role
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();

        // Update role for wrong user
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $otherUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertStatus(410);

        // Check if member role is changed
        $foundNewUser = $room->members()->find($newUser);
        $this->assertEquals(RoomUserRole::MODERATOR, $foundNewUser->pivot->role);

        // Update role as member user
        $this->actingAs($memberUser)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();

        // Update role as member moderator
        $this->actingAs($memberModerator)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();

        // Update role as member co-owner
        $this->actingAs($memberCoOwner)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();

        // Update role with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Update role with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.member.update', ['room' => $room, 'user' => $newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
    }

    public function test_bulk_import_members()
    {
        $newUser = User::factory()->create();
        $user23Email = $this->faker->email();
        $newUser2 = User::factory()->create(['email' => $user23Email]);
        $newUser3 = User::factory()->create(['email' => $user23Email]);
        $newUser4 = User::factory()->create();
        $invalidEmail = $this->faker->email();
        $noEmail = $this->faker->word();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();

        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);

        //Add single member acting as guest
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertUnauthorized();

        //Add single member acting as non owner
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertForbidden();

        //Add single member acting as other member
        $this->actingAs($memberUser)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertForbidden();

        //Add single member acting as moderator
        $this->actingAs($memberModerator)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertForbidden();

        //Add single member acting as co-owner
        $this->actingAs($memberCoOwner)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        //Add multiple member acting as co-owner
        $this->actingAs($memberCoOwner)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);
        $room->members()->detach($newUser4->id);

        //Add single member acting as owner
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        //Add multiple member acting as owner
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);
        $room->members()->detach($newUser4->id);

        //Add single member with invalid role
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => 10])
            ->assertJsonValidationErrors(['role']);

        //Add multiple members as user
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();

        // Check if members are added with correct role
        $foundNewUser = $room->members()->find($newUser);
        $this->assertNotNull($foundNewUser);
        $this->assertEquals(RoomUserRole::USER, $foundNewUser->pivot->role);

        $foundNewUser4 = $room->members()->find($newUser4);
        $this->assertNotNull($foundNewUser4);
        $this->assertEquals(RoomUserRole::USER, $foundNewUser4->pivot->role);

        // Reset membership
        $room->members()->detach($newUser->id);
        $room->members()->detach($newUser4->id);

        //Add multiple members as moderator
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::MODERATOR])
            ->assertNoContent();
        $room->members()->detach($newUser->id);
        $room->members()->detach($newUser4->id);

        //Add multiple members as co-owner
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::CO_OWNER])
            ->assertNoContent();

        //Add same members again
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $newUser4->email], 'role' => RoomUserRole::CO_OWNER])
            ->assertJsonValidationErrors('user_emails.0')
            ->assertJsonValidationErrors('user_emails.1');
        $room->members()->detach($newUser->id);
        $room->members()->detach($newUser4->id);

        //Add owner
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$owner->email], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.0');

        //Add not existing user email
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$invalidEmail], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.0');

        //Add with input that is no email
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$noEmail], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.0');

        //Add without input
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails');

        //Add with to many emails
        $emailList = [];
        for ($i = 0; $i < 1001; $i++) {
            $emailList[] = $this->faker->unique()->email();
        }
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => $emailList, 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails');

        //Add without data
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), [])
            ->assertJsonValidationErrors('user_emails')
            ->assertJsonValidationErrors('role');

        //Add 2 users with the same email
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser2->email, $newUser3->email], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.0')
            ->assertJsonValidationErrors('user_emails.1');

        //Add 1 user with email that two users have
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser2->email], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.0');

        //Add 1 valid and 1 invalid user
        $this->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email, $invalidEmail], 'role' => RoomUserRole::USER])
            ->assertJsonValidationErrors('user_emails.1')
            ->assertJsonMissingValidationErrors('user_emails.0');

        // Test view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.bulkImport', ['room' => $room]), ['user_emails' => [$newUser->email], 'role' => RoomUserRole::USER])
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
    }

    public function test_bulk_update_members()
    {
        // create possible users for the test
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        // create and save new test-room
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);

        // Update with wrong role
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => 10]
        )->assertJsonValidationErrors(['role']);

        // Update role
        $this->assertEquals(RoomUserRole::USER, $room->members->find($memberUser)->pivot->role);
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertNoContent();
        $room->refresh();
        $this->assertEquals(RoomUserRole::MODERATOR, $room->members->find($memberUser)->pivot->role);
        // Reset membership role
        $room->members()->updateExistingPivot($memberUser, ['role' => RoomUserRole::USER]);
        $room->refresh();

        // Update role for wrong user
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$otherUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertUnprocessable();

        // Update role of person who is not a member of the room
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$newUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertJsonValidationErrors(['users.0']);

        //Update himself as owner
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$owner->id], 'role' => RoomUserRole::MODERATOR]
        )->assertJsonValidationErrors(['users.0']);

        // Try without data
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            []
        )->assertJsonValidationErrors(['users']);

        // Try with invalid array
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id, $owner->id]]
        )->assertJsonValidationErrors(['users.1']);

        // Update several members at the same time
        $this->assertEquals(RoomUserRole::USER, $room->members->find($memberUser)->pivot->role);
        $this->assertEquals(RoomUserRole::CO_OWNER, $room->members->find($memberCoOwner)->pivot->role);
        $this->actingAs($owner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id, $memberCoOwner->id], 'role' => RoomUserRole::MODERATOR]
        )->assertNoContent();
        $room->refresh();
        $this->assertEquals(RoomUserRole::MODERATOR, $room->members->find($memberUser)->pivot->role);
        $this->assertEquals(RoomUserRole::MODERATOR, $room->members->find($memberCoOwner)->pivot->role);
        // Reset membership role
        $room->members()->updateExistingPivot($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->updateExistingPivot($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);
        $room->refresh();

        // Update role as member user
        $this->actingAs($memberUser)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();

        //Update self as user
        $this->actingAs($memberUser)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();

        // Update role as member moderator
        $this->actingAs($memberModerator)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();

        //Update self as moderator
        $this->actingAs($memberModerator)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberModerator->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();

        //Update self as co-owner
        $this->actingAs($memberCoOwner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberCoOwner->id], 'role' => RoomUserRole::MODERATOR]
        )->assertJsonValidationErrors(['users.0']);

        // Update member as a room co-owner
        $this->assertTrue($room->members->contains($memberUser));
        $this->actingAs($memberCoOwner)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertNoContent();
        $room->refresh();
        $this->assertEquals(RoomUserRole::MODERATOR, $room->members->find($memberUser)->pivot->role);
        // Reset membership role
        $room->members()->updateExistingPivot($memberUser, ['role' => RoomUserRole::USER]);
        $room->refresh();

        // Update role with view rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Update role with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);

        // Update role as normal user
        $this->actingAs($newUser)->putJson(
            route('api.v1.rooms.member.bulkUpdate', ['room' => $room]),
            ['users' => [$memberUser->id], 'role' => RoomUserRole::MODERATOR]
        )->assertForbidden();
    }

    public function test_bulk_remove_members()
    {
        // create possible users for the test
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();

        // create and save new test-room
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role' => RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role' => RoomUserRole::CO_OWNER]);

        // Remove members as guest
        $this->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertUnauthorized();

        // Remove members as non owner
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove members as user member
        $this->actingAs($memberUser)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove members as moderator member
        $this->actingAs($memberModerator)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove members as co-owner member
        $this->actingAs($memberCoOwner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertNoContent();
        $room->refresh();
        $this->assertNull($room->members()->find($memberUser));
        // Restore membership of newUser
        $room->members()->attach([$memberUser->id], ['role' => RoomUserRole::USER]);
        $room->refresh();

        // Remove members as owner
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertNoContent();
        $room->refresh();
        $this->assertNull($room->members()->find($memberUser));
        // Restore membership of newUser
        $room->members()->attach([$memberUser->id], ['role' => RoomUserRole::USER]);
        $room->refresh();

        // Remove multiple members as owner
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id, $memberModerator->id]])
            ->assertNoContent();
        $room->refresh();
        $this->assertNull($room->members()->find($memberUser));
        $this->assertNull($room->members()->find($memberModerator));
        // Restore membership of newUser
        $room->members()->attach([$memberUser->id], ['role' => RoomUserRole::USER]);
        $room->members()->attach([$memberModerator->id], ['role' => RoomUserRole::MODERATOR]);
        $room->refresh();

        // Remove with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Remove with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id]])
            ->assertNoContent();
        $room->refresh();
        $this->assertNull($room->members()->find($memberUser));
        $this->role->permissions()->detach($this->managePermission);
        // Restore membership of newUser
        $room->members()->attach($memberUser, ['role' => RoomUserRole::USER]);
        $room->refresh();

        // Remove member with invalid user
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [0]])
            ->assertUnprocessable();

        // Remove user that is no member of the room
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$newUser->id]])
            ->assertUnprocessable();

        // Remove yourself as co-owner
        $this->actingAs($memberCoOwner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room' => $room]), ['users' => [$memberUser->id, $memberCoOwner->id]])
            ->assertUnprocessable();
    }
}
