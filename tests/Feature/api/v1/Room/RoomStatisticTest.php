<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\RoomUserRole;
use App\Meeting;
use App\MeetingStat;
use App\Permission;
use App\Role;
use App\Room;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * Testing the statistical features of a room
 * @package Tests\Feature\api\v1\Room
 */
class RoomStatisticTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user, $role, $managePermission, $viewAllPermission;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = factory(User::class)->create();

        $this->seed('RolesAndPermissionsSeeder');

        $this->role                 = factory(Role::class)->create();
        $this->managePermission     = Permission::where('name', 'rooms.manage')->first();
        $this->viewAllPermission    = Permission::where('name', 'rooms.viewAll')->first();
    }

    /**
     * Test to list of meetings for a room
     */
    public function testMeetingList()
    {
        setting(['pagination_page_size' => 5]);

        // create room
        $room = factory(Room::class)->create();

        // create meetings for room
        $meetings   = [];
        $meetings[] = new Meeting(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:35:23', 'record_attendance'=>true]);
        $meetings[] = new Meeting(['start' => '2020-01-05 09:13:10', 'end' => '2020-01-05 09:54:31', 'record_attendance'=>false]);
        $meetings[] = new Meeting(['start' => '2020-01-07 16:58:22', 'end' => '2020-01-07 17:05:33', 'record_attendance'=>false]);
        $meetings[] = new Meeting(['start' => '2020-10-09 17:12:23', 'end' => '2020-10-09 17:45:11', 'record_attendance'=>false]);
        $meetings[] = new Meeting(['start' => '2020-12-03 10:54:34', 'end' => '2020-12-03 11:09:53', 'record_attendance'=>false]);
        $meetings[] = new Meeting(['start' => '2021-01-07 19:32:54', 'end' => null, 'record_attendance'=>false]);
        $room->meetings()->saveMany($meetings);

        // check guests
        $this->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertForbidden();

        // check room user
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertForbidden();
        $room->members()->detach($this->user);

        // check room moderator
        $room->members()->attach($this->user, ['role'=>RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertForbidden();
        $room->members()->detach($this->user);

        // check room co-owner
        $room->members()->attach($this->user, ['role'=>RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertSuccessful();
        $room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // check content and sort order of response
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonCount(5, 'data')
            ->assertJsonFragment(['per_page' => 5])
            ->assertJsonFragment(['total' => 6])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'start',
                        'end',
                        'record_attendance',
                    ]
                ]
            ])
            ->assertJsonPath('data.0', [
                'id'                => $meetings[5]->id,
                'start'             => $meetings[5]->start->toJson(),
                'end'               => null,
                'record_attendance' => false
            ])
            ->assertJsonPath('data.1', [
                'id'                => $meetings[4]->id,
                'start'             => $meetings[4]->start->toJson(),
                'end'               => $meetings[4]->end->toJson(),
                'record_attendance' => false
            ]);

        // check pagination
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room'=>$room]).'?page=2')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['per_page' => 5])
            ->assertJsonFragment(['total' => 6])
            ->assertJsonPath('data.0', [
                'id'                => $meetings[0]->id,
                'start'             => $meetings[0]->start->toJson(),
                'end'               => $meetings[0]->end->toJson(),
                'record_attendance' => true
            ]);
    }

    /**
     * Test to list of meetings for a room
     */
    public function testUsageStatistics()
    {
        setting(['pagination_page_size' => 5]);

        // create room
        $meeting = factory(Meeting::class)->create(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:18:23']);

        // create meetings for room
        $stats   = [];
        $stats[] = new MeetingStat(['participant_count' => 1, 'listener_count' => 0, 'voice_participant_count' => 0, 'video_count' => 0, 'created_at' => '2020-01-01 08:13:00']);
        $stats[] = new MeetingStat(['participant_count' => 2, 'listener_count' => 1, 'voice_participant_count' => 1, 'video_count' => 0, 'created_at' => '2020-01-01 08:14:00']);
        $stats[] = new MeetingStat(['participant_count' => 3, 'listener_count' => 2, 'voice_participant_count' => 2, 'video_count' => 1, 'created_at' => '2020-01-01 08:15:00']);
        $stats[] = new MeetingStat(['participant_count' => 4, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 1, 'created_at' => '2020-01-01 08:16:00']);
        $stats[] = new MeetingStat(['participant_count' => 5, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 3, 'created_at' => '2020-01-01 08:17:00']);
        $stats[] = new MeetingStat(['participant_count' => 3, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 4, 'created_at' => '2020-01-01 08:18:00']);
        $meeting->stats()->saveMany($stats);

        // check guests
        $this->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertForbidden();

        // check room user
        $meeting->room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room moderator
        $meeting->room->members()->attach($this->user, ['role'=>RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room co-owner
        $meeting->room->members()->attach($this->user, ['role'=>RoomUserRole::CO_OWNER]);
        $this->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertSuccessful();
        $meeting->room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // check content and sort order of response
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.stats', ['meeting'=>$meeting]))
            ->assertSuccessful()
            ->assertJsonCount(6, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'participant_count',
                        'listener_count',
                        'voice_participant_count',
                        'video_count',
                        'created_at',
                    ]
                ]
            ])
            ->assertJsonPath('data.0', [
                'id'                      => $stats[0]->id,
                'participant_count'       => 1,
                'listener_count'          => 0,
                'voice_participant_count' => 0,
                'video_count'             => 0,
                'created_at'              => $stats[0]->created_at->toJson(),
            ]);
    }
}
