<?php

namespace Tests\Feature\api\v1\Room;

use App\RoomType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * General room api feature tests
 * @package Tests\Feature\api\v1\Room
 */
class RoomTypeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test to get a list of all room types
     */
    public function testIndex()
    {
        $roomType = factory(RoomType::class)->create();

        $this->getJson(route('api.v1.roomTypes.index'))
            ->assertSuccessful()
            ->assertJsonFragment(
                ['id' => $roomType->id,'short'=>$roomType->short,'description'=>$roomType->description,'color'=>$roomType->color,'default'=>$roomType->default]
            );
    }
}
