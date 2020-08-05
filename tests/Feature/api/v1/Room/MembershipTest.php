<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Room;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class MembershipTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testAccessCodeMembership()
    {
        $user = factory(User::class)->create();

        $room = factory(Room::class)->create([
            'allowGuests'     => true,
            'allowMembership' => true,
            'accessCode'      => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $this->actingAs($user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allowMembership' => true]);

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>'']))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => false]);
    }

    public function testJoinMembership()
    {
        $user = factory(User::class)->create();
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $this->actingAs($user)->postJson(route('api.v1.rooms.membership.join', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertForbidden();

        $room->allowMembership = true;
        $room->save();

        $this->actingAs($user)->postJson(route('api.v1.rooms.membership.join', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200);
        // Try to get room details with access code even not needed
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => true]);
        // Try to get room details without access code, because members don't need it
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => true]);
    }

    public function testLeaveMembership()
    {
        $user = factory(User::class)->create();
        $room = factory(Room::class)->create([
            'allowGuests'     => true,
            'allowMembership' => true,
            'accessCode'      => $this->faker->numberBetween(111111111, 999999999)
        ]);

        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);

        $this->actingAs($user)->deleteJson(route('api.v1.rooms.membership.leave', ['room'=>$room]))
            ->assertStatus(200);
        // Check membership is removed
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true,  'allowMembership' => true, 'isMember' => false]);
        // Try to get room details without access code
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false,  'allowMembership' => true, 'isMember' => false]);
    }

    /**
     * Test functionality room owner adding member
     */
    public function testAddMember()
    {
        $user  = factory(User::class)->create();
        $owner = factory(User::class)->create();

        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        // Add member as guest
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$user->id,'role'=>RoomUserRole::USER])
            ->assertUnauthorized();

        // Add member as non owner
        $this->actingAs($user)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$user->id,'role'=>RoomUserRole::USER])
            ->assertForbidden();

        // Add member with invalid role
        $this->actingAs($owner)->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$user->id,'role'=>10])
            ->assertJsonValidationErrors(['role']);

        // Add member with invalid user
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>0,'role'=>RoomUserRole::USER])
            ->assertJsonValidationErrors(['user']);

        // Add member
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$user->id,'role'=>RoomUserRole::USER])
            ->assertOk();

        // Add same member again
        $this->postJson(route('api.v1.rooms.member.add', ['room'=>$room]), ['user'=>$user->id,'role'=>RoomUserRole::USER])
            ->assertJsonValidationErrors('user');

        // Check member list
        $this->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonFragment(['id'=>$user->id,'email'=>$user->email,'firstname'=>$user->firstname,'lastname'=>$user->lastname]);

        // Check if user is member
        $this->actingAs($user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true, 'isMember' => true]);
    }

    /**
     * Test functionality room owner removing member
     */
    public function testRemoveMember()
    {
        $user  = factory(User::class)->create();
        $owner = factory(User::class)->create();

        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);

        // Add member as guest
        $this->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$user]))
            ->assertUnauthorized();

        // Add member as non owner
        $this->actingAs($user)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$user]))
            ->assertForbidden();

        // Add member with invalid user
        $this->actingAs($owner)->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>0]))
            ->assertNotFound();

        // Remove member
        $this->deleteJson(route('api.v1.rooms.member.remove', ['room'=>$room,'user'=>$user]))
            ->assertOk();

        // Check member list
        $this->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonMissing(['id'=>$user->id,'email'=>$user->email,'firstname'=>$user->firstname,'lastname'=>$user->lastname]);

        // Check if user is no member
        $this->actingAs($user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['isMember' => false]);
    }

    /**
     * Test functionality room owner removing member
     */
    public function testChangeMemberRole()
    {
        $user  = factory(User::class)->create();
        $owner = factory(User::class)->create();

        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $room->owner()->associate($owner);
        $room->save();

        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);

        // Check member list
        $this->actingAs($owner)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonFragment(['id'=>$user->id,'role'=>RoomUserRole::USER]);

        // Update with wrong role
        $this->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$user]), ['role' => 10])
            ->assertJsonValidationErrors(['role']);

        // Update role
        $this->putJson(route('api.v1.rooms.member.update', ['room'=>$room,'user'=>$user]), ['role' => RoomUserRole::MODERATOR])
            ->assertOk();

        // Check member list
        $this->actingAs($owner)->getJson(route('api.v1.rooms.member.get', ['room'=>$room]))
            ->assertOk()
            ->assertJsonFragment(['id'=>$user->id,'role'=>RoomUserRole::MODERATOR]);
    }
}
