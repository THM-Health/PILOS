<?php

namespace Tests\Feature\api\v1;

use App\Room;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * General room types api feature tests
 * @package Tests\Feature\api\v1\RoomType
 */
class Meeting extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed('RolesAndPermissionsSeeder');
        $this->user = factory(User::class)->create();
    }

    /**
     * Test to get a list of all running meetings
     */
    public function testIndex()
    {
        $meetings = factory(self::class)->create();

        // Test guests
        $this->getJson(route('api.v1.meetings.index'))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.index'))
            ->assertForbidden();
    }
}
