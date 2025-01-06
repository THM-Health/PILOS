<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Meeting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\Server;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

/**
 * General room types api feature tests
 */
class MeetingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
    }

    /**
     * Test to get a list of all running meetings
     */
    public function test_index()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $oldMeeting = Meeting::factory()->create();
        $startingMeetings = Meeting::factory()->count(7)->create(['start' => null, 'end' => null]);
        $runningMeetings = Meeting::factory()->count(7)
            ->sequence(fn ($sequence) => ['start' => date('Y-m-d H:i:s', strtotime('2021-01-10 8:40:20') + (10 * ($sequence->index + 1)))])
            ->create(['end' => null]);
        $server = Server::factory()->create(['name' => 'Testserver']);
        $user1 = User::factory()->create(['firstname' => 'John', 'lastname' => 'Doe']);
        $user2 = User::factory()->create(['firstname' => 'Max', 'lastname' => 'Doe']);
        $room1 = Room::factory()->create(['name' => 'Test room 1', 'user_id' => $user1->id, 'participant_count' => 5]);
        $room2 = Room::factory()->create(['name' => 'Test room 2', 'user_id' => $user1->id, 'participant_count' => 4]);
        $room3 = Room::factory()->create(['name' => 'Test room 3', 'user_id' => $user2->id, 'participant_count' => 1]);
        $meeting1 = Meeting::factory()->create(['server_id' => $server->id, 'room_id' => $room1->id, 'start' => '2021-01-12 8:40:20', 'end' => null]);
        $meeting2 = Meeting::factory()->create(['server_id' => $server->id, 'room_id' => $room2->id, 'start' => '2021-01-12 8:42:30', 'end' => null]);
        $meeting3 = Meeting::factory()->create(['server_id' => $server->id, 'room_id' => $room3->id, 'start' => '2021-01-12 8:42:55', 'end' => null]);

        // Test guests
        $this->getJson(route('api.v1.meetings.index'))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.index'))
            ->assertForbidden();

        // Authenticated user with permission
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'meetings.viewAny']);
        $role->permissions()->attach($permission->id);
        $role->users()->attach($this->user->id);

        $this->actingAs($this->user)->getJson(route('api.v1.meetings.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $runningMeetings[0]->id])
            ->assertJsonFragment(['id' => $runningMeetings[4]->id])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 10])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'start',
                        'end',
                        'room' => [
                            'id',
                            'owner',
                            'name',
                            'participant_count',
                            'listener_count',
                            'voice_participant_count',
                            'video_count',
                        ],
                        'server' => [
                            'id',
                            'name',
                        ],
                    ],
                ],
            ]);

        // Pagination
        $this->getJson(route('api.v1.meetings.index').'?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $runningMeetings[5]->id]);

        // Clean other running meetings to make the test easier
        Meeting::destroy($runningMeetings->pluck('id'));

        // Filtering by room name
        $this->getJson(route('api.v1.meetings.index').'?search=Test+room')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $meeting1->id])
            ->assertJsonFragment(['id' => $meeting2->id])
            ->assertJsonFragment(['id' => $meeting3->id]);

        // Filtering by owner
        $this->getJson(route('api.v1.meetings.index').'?search=John+Doe')
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $meeting1->id])
            ->assertJsonFragment(['id' => $meeting2->id]);

        // Filtering by server
        $this->getJson(route('api.v1.meetings.index').'?search=Testserver')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $meeting1->id])
            ->assertJsonFragment(['id' => $meeting2->id])
            ->assertJsonFragment(['id' => $meeting3->id]);

        // Filtering by combination
        $this->getJson(route('api.v1.meetings.index').'?search=Testserver+Doe+room+2')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $meeting2->id]);

        // Sort by start asc
        $this->getJson(route('api.v1.meetings.index').'?sort_by=start&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $meeting1->id)
            ->assertJsonPath('data.1.id', $meeting2->id)
            ->assertJsonPath('data.2.id', $meeting3->id);

        // Sort by start desc
        $this->getJson(route('api.v1.meetings.index').'?sort_by=start&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $meeting3->id)
            ->assertJsonPath('data.1.id', $meeting2->id)
            ->assertJsonPath('data.2.id', $meeting1->id);

        // Sort by participants asc
        $this->getJson(route('api.v1.meetings.index').'?sort_by=room.participant_count&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $meeting3->id)
            ->assertJsonPath('data.1.id', $meeting2->id)
            ->assertJsonPath('data.2.id', $meeting1->id);

        // Sort by participants desc
        $this->getJson(route('api.v1.meetings.index').'?sort_by=room.participant_count&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $meeting1->id)
            ->assertJsonPath('data.1.id', $meeting2->id)
            ->assertJsonPath('data.2.id', $meeting3->id);
    }
}
