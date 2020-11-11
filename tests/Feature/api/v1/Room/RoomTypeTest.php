<?php

namespace Tests\Feature\api\v1\Room;

use App\RoomType;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * General room types api feature tests
 * @package Tests\Feature\api\v1\RoomType
 */
class RoomTypeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = factory(User::class)->create();
    }

    /**
     * Test to get a list of all room types
     */
    public function testIndex()
    {
        $roomType = factory(RoomType::class)->create();

        // Test guests
        $this->getJson(route('api.v1.room_types.index'))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.room_types.index'))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id,'short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color]
            );
    }
}
