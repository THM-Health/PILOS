<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomUserRole;
use App\Room;
use App\Server;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testGuestAccess()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true
        ]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200);
    }

    public function testDisableGuestAccess()
    {
        $room = factory(Room::class)->create();
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(403);
    }

    public function testAccessCodeGuests()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false]);

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>'']))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true]);
    }

    public function testAccessCodeUser()
    {
        $user = factory(User::class)->create();

        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        $this->actingAs($user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false, 'allowMembership' => false]);

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>'']))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();

        $this->getJson(route('api.v1.rooms.show', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true]);
    }

    /**
     * Testing to start room but no server available
     */
    public function testStartOnlyModeratorsNoServer()
    {
        $user = factory(User::class)->create();
        $room = factory(Room::class)->create([
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertForbidden();

        // Testing authorized users
        $this->actingAs($user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertForbidden();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing member
        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    /**
     * Testing to start room with guests allowed, and everyone can start but no server available
     */
    public function testStartNoServer()
    {
        $user = factory(User::class)->create();
        $room = factory(Room::class)->create([
            'allowGuests'      => true,
            'everyoneCanStart' => true,
            'accessCode'       => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertJsonValidationErrors('name');
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode,'name'=>'<script>alert("HI");</script>']))
            ->assertJsonValidationErrors('name');
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode,'name'=>$this->faker->name]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing authorized users
        $this->actingAs($user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing member
        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    public function testStartWithServer()
    {
        $room = factory(Room::class)->create();

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Create server
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Try to start bbb meeting
        $response = Http::withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());
    }

    public function testJoin()
    {
        $user = factory(User::class)->create();
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Try to start bbb meeting
        $response = Http::withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        \Auth::logout();

        // Check if room is running
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['running' => true]);

        // Join as guest, without required access code
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertForbidden();
        // Join as guest without name
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertJsonValidationErrors('name');
        // Join as guest with invalid/dangerous name
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode,'name'=>'<script>alert("HI");</script>']))
            ->assertJsonValidationErrors('name');
        // Join as guest
        $response = $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode,'name'=>$this->faker->name]))
            ->assertSuccessful();

        // Join as authorized users
        $this->actingAs($user)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$this->faker->numberBetween(111111111, 999999999)]))
            ->assertUnauthorized();
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertSuccessful();

        // Testing member
        $room->members()->attach($user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($user)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertSuccessful();
    }
}
