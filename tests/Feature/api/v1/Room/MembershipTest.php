<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Permission;
use App\Role;
use App\Room;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MembershipTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user, $role, $managePermission, $viewAllPermission;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user                 = User::factory()->create();
        $this->role                 = Role::factory()->create();

        $this->managePermission     = Permission::factory()->create(['name'=>'rooms.manage']);
        $this->viewAllPermission    = Permission::factory()->create(['name'=>'rooms.viewAll']);
    }

    public function testAccessCodeMembership()
    {
        $room = Room::factory()->create([
            'allowGuests'     => true,
            'allowMembership' => true,
            'accessCode'      => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allowMembership' => true]);

        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => false]);
    }

    public function testJoinMembership()
    {
        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $this->withHeaders(['Access-Code' => $room->accessCode])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room'=>$room]))
            ->assertForbidden();

        $room->allowMembership = true;
        $room->save();

        $this->withHeaders(['Access-Code' => $room->accessCode])->actingAs($this->user)->postJson(route('api.v1.rooms.membership.join', ['room'=>$room]))
            ->assertNoContent();
        // Try to get room details with access code even not needed
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => true]);
        // Try to get room details without access code, because members don't need it
        $this->flushHeaders();
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => true]);
    }

    public function testLeaveMembership()
    {
        $room = Room::factory()->create([
            'allowGuests'     => true,
            'allowMembership' => true,
            'accessCode'      => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);

        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.membership.leave', ['room'=>$room]))
            ->assertNoContent();
        // Check membership is removed
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => false]);
        // Try to get room details without access code
        $this->flushHeaders();
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allowMembership' => true, 'isMember' => false]);
    }

    /**
     * Test list of room members for required permissions and response content
     */
    public function testMemberList()
    {
        $memberUser      = User::factory()->create(['image' => 'test.jpg']);
        $memberModerator = User::factory()->create();
        $memberCoOwner   = User::factory()->create();
        $owner           = User::factory()->create();

        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role'=>RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role'=>RoomUserRole::CO_OWNER]);

        // Check member list as guest
        $this->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertUnauthorized();

        // Check member list as user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertForbidden();

        // Check member list as member user
        $this->actingAs($memberUser)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertForbidden();

        // Check member list as member moderator
        $this->actingAs($memberModerator)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertForbidden();

        // Check member list as member co-owner
        $this->actingAs($memberCoOwner)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertSuccessful();

        // Check member list as owner and response
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['id'=>$memberUser->id,'firstname'=>$memberUser->firstname,'lastname'=>$memberUser->lastname,'email'=>$memberUser->email,'role'=>RoomUserRole::USER, 'image' => $memberUser->imageUrl])
            ->assertJsonFragment(['id'=>$memberModerator->id,'firstname'=>$memberModerator->firstname,'lastname'=>$memberModerator->lastname,'email'=>$memberModerator->email,'role'=>RoomUserRole::MODERATOR, 'image' => $memberUser->imageUrl])
            ->assertJsonFragment(['id'=>$memberCoOwner->id,'firstname'=>$memberCoOwner->firstname,'lastname'=>$memberCoOwner->lastname,'email'=>$memberCoOwner->email,'role'=>RoomUserRole::CO_OWNER, 'image' => $memberUser->imageUrl]);

        // Check member list with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Check member list with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);
    }

    /**
     * Test functionality room owner adding member
     */
    public function testAddMember()
    {
        $newUser         = User::factory()->create();
        $memberUser      = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner   = User::factory()->create();
        $owner           = User::factory()->create();

        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->sync([$memberUser->id => ['role'=>RoomUserRole::USER],$memberModerator->id => ['role'=>RoomUserRole::MODERATOR],$memberCoOwner->id => ['role'=>RoomUserRole::CO_OWNER]]);

        // Add member as guest
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertUnauthorized();

        // Add member as non owner
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertForbidden();

        // Add user member add other member
        $this->actingAs($memberUser)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertForbidden();

        // Add moderator member add other member
        $this->actingAs($memberModerator)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertForbidden();

        // Add co-owner member add other member
        $this->actingAs($memberCoOwner)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member with invalid role
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>10])
            ->assertJsonValidationErrors(['role']);

        // Add member with invalid user
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>0,'role'=>RoomUserRole::USER])
            ->assertJsonValidationErrors(['user']);

        // Add member as user
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member as moderator
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::MODERATOR])
            ->assertNoContent();
        $room->members()->detach($newUser->id);

        // Add member as co-owner
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::CO_OWNER])
            ->assertNoContent();

        // Add same member again
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertJsonValidationErrors('user');

        // Check member list
        $this->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonFragment(['id'=>$newUser->id,'email'=>$newUser->email,'firstname'=>$newUser->firstname,'lastname'=>$newUser->lastname]);

        // Check if user is member
        $this->actingAs($newUser)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true, 'isMember' => true]);

        // Reset membership
        $room->members()->detach($newUser->id);

        // Test view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$newUser->id,'role'=>RoomUserRole::USER])
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
    }

    /**
     * Test functionality room owner removing member
     */
    public function testRemoveMember()
    {
        $newUser         = User::factory()->create();
        $memberUser      = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner   = User::factory()->create();
        $owner           = User::factory()->create();

        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($newUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role'=>RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role'=>RoomUserRole::CO_OWNER]);

        // Remove member as guest
        $this->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertUnauthorized();

        // Remove member as non owner
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertForbidden();

        // Remove member as user member
        $this->actingAs($memberUser)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertForbidden();

        // Remove member as moderator member
        $this->actingAs($memberModerator)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertForbidden();

        // Remove member as co-owner member
        $this->actingAs($memberCoOwner)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertNoContent();
        $room->members()->attach($newUser, ['role'=>RoomUserRole::USER]);

        // Remove with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Remove with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
        $room->members()->attach($newUser, ['role'=>RoomUserRole::USER]);

        // Remove member with invalid user
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>0]))
            ->assertNotFound();

        // Remove member as moderator
        $this->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertNoContent();

        // Check member list
        $this->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonMissing(['id'=>$newUser->id,'email'=>$newUser->email,'firstname'=>$newUser->firstname,'lastname'=>$newUser->lastname]);

        // Try to remove user again
        $this->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$newUser]))
            ->assertStatus(410);

        // Check if user is no member
        $this->actingAs($newUser)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['isMember' => false]);
    }

    /**
     * Test functionality of bulk removal of members
     */
    public function testBulkRemoveMember()
    {
        $newUser = User::factory()->create();
        $memberUser = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner = User::factory()->create();
        $owner = User::factory()->create();

        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($newUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role'=>RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role'=>RoomUserRole::CO_OWNER]);

        // Remove member as guest
        $this->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertUnauthorized();

        // Remove member as a normal user
        $this->actingAs($newUser)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove member as a room member
        $this->actingAs($memberUser)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove member as a room moderator
        $this->actingAs($memberModerator)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertForbidden();

        // Remove member as a room co-owner
        $this->assertTrue($room->members->contains($memberUser));
        $this->actingAs($memberCoOwner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertSuccessful();
        $room->refresh();
        $this->assertFalse($room->members->contains($memberUser));
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->refresh();

        // Remove member as owner
        $this->assertTrue($room->members->contains($memberUser));
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id]])
            ->assertSuccessful();
        $room->refresh();
        $this->assertFalse($room->members->contains($memberUser));
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->refresh();

        // Remove himself as owner
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$owner->id]])
            ->assertJsonValidationErrors(['users.0']);

        // Remove user that is no member of the room
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$newUser->id]])
            ->assertJsonValidationErrors(['users.0']); //Status 410?

        // Try without data
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), [])
            ->assertJsonValidationErrors(['users']);

        // Try with invalid array
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => 123])
            ->assertJsonValidationErrors(['users']);

        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id, $owner->id]])
            ->assertJsonValidationErrors(['users.1']);

        // Check if members were removed
        $this->assertTrue($room->members->contains($memberUser));
        $this->assertTrue($room->members->contains($memberCoOwner));
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>$room]), ['users' => [$memberUser->id, $memberCoOwner->id]])
            ->assertSuccessful();
        $room->refresh();
        $this->assertFalse($room->members->contains($memberUser));
        $this->assertFalse($room->members->contains($memberCoOwner));
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberCoOwner, ['role'=>RoomUserRole::CO_OWNER]);
        $room->refresh();

        // Try with wrong room id
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.bulkDestroy', ['room'=>'room']), ['users' => [$memberUser->id]])
            ->assertFalse();

        // Try with wrong route

    }

    /**
     * Test functionality room owner removing member //shouldn't this be editing member role?
     */
    public function testChangeMemberRole()
    {
        $newUser         = User::factory()->create();
        $memberUser      = User::factory()->create();
        $memberModerator = User::factory()->create();
        $memberCoOwner   = User::factory()->create();
        $owner           = User::factory()->create();
        $otherUser       = User::factory()->create();

        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($newUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberUser, ['role'=>RoomUserRole::USER]);
        $room->members()->attach($memberModerator, ['role'=>RoomUserRole::MODERATOR]);
        $room->members()->attach($memberCoOwner, ['role'=>RoomUserRole::CO_OWNER]);

        // Update with wrong role
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => 10])
            ->assertJsonValidationErrors(['role']);

        // Update role
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();

        // Update role for wrong user
        $this->actingAs($owner)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$otherUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertStatus(410);

        // Check member list
        $this->actingAs($owner)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonFragment(['id'=>$newUser->id,'role'=>RoomUserRole::MODERATOR]);

        // Update role as member user
        $this->actingAs($memberUser)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();

        // Update role as member moderator
        $this->actingAs($memberModerator)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();

        // Update role as member co-owner
        $this->actingAs($memberCoOwner)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();

        // Update role with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Update role with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$newUser]), ['role' => RoomUserRole::MODERATOR])
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);
    }
}
