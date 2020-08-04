<?php

namespace Tests\Feature\api\v1\Room;

use App\Room;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
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
}
