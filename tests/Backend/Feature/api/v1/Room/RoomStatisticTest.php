<?php

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingStat;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\AttendanceExcelImport;

/**
 * Testing the statistical features of a room
 */
class RoomStatisticTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $role;

    protected $managePermission;

    protected $viewAllPermission;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role = Role::factory()->create();
        $this->managePermission = Permission::where('name', 'rooms.manage')->first();
        $this->viewAllPermission = Permission::where('name', 'rooms.viewAll')->first();
    }

    /**
     * Test to list of meetings for a room
     */
    public function test_meeting_list()
    {
        $this->generalSettings->pagination_page_size = 5;
        $this->generalSettings->save();

        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->save();

        // create room
        $room = Room::factory()->create();

        // create meetings for room
        $meetings = [];
        $meetings[] = new Meeting(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:35:23']);
        $meetings[] = new Meeting(['start' => '2020-01-05 09:13:10', 'end' => '2020-01-05 09:54:31']);
        $meetings[] = new Meeting(['start' => '2020-01-07 16:58:22', 'end' => '2020-01-07 17:05:33']);
        $meetings[] = new Meeting(['start' => '2020-10-09 17:12:23', 'end' => '2020-10-09 17:45:11']);
        $meetings[] = new Meeting(['start' => '2020-12-03 10:54:34', 'end' => '2020-12-03 11:09:53']);
        $meetings[] = new Meeting(['start' => '2021-01-07 19:32:54', 'end' => null]);
        $meetings[] = new Meeting(['start' => null, 'end' => null]);
        $room->meetings()->saveMany($meetings);

        // create meetings for room
        $meetings[0]->stats()->save(new MeetingStat(['participant_count' => 1, 'listener_count' => 0, 'voice_participant_count' => 0, 'video_count' => 0, 'created_at' => '2020-01-01 08:13:00']));
        $meetings[0]->attendees()->save(new MeetingAttendee(['name' => 'Marie Walker', 'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb', 'join' => '2020-01-01 08:13:11', 'leave' => '2020-01-01 08:15:51']));

        // check guests
        $this->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertForbidden();

        // check room user
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertForbidden();
        $room->members()->detach($this->user);

        // check room moderator
        $room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertForbidden();
        $room->members()->detach($this->user);

        // check room co-owner
        $room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertSuccessful();
        $room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // check content and sort order of response
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
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
                        'attendance',
                        'statistical',
                    ],
                ],
            ])
            ->assertJsonPath('data.0', [
                'id' => $meetings[0]->id,
                'start' => $meetings[0]->start->toJson(),
                'end' => $meetings[0]->end->toJson(),
                'attendance' => true,
                'statistical' => true,
            ])
            ->assertJsonPath('data.1', [
                'id' => $meetings[1]->id,
                'start' => $meetings[1]->start->toJson(),
                'end' => $meetings[1]->end->toJson(),
                'attendance' => false,
                'statistical' => false,
            ]);

        // check pagination
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room' => $room]).'?page=2')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['per_page' => 5])
            ->assertJsonFragment(['total' => 6])
            ->assertJsonPath('data.0', [
                'id' => $meetings[5]->id,
                'start' => $meetings[5]->start->toJson(),
                'end' => null,
                'attendance' => false,
                'statistical' => false,
            ]);

        // check with meeting stats globally disabled
        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room' => $room]))
            ->assertJsonPath('data.0', [
                'id' => $meetings[0]->id,
                'start' => $meetings[0]->start->toJson(),
                'end' => $meetings[0]->end->toJson(),
                'attendance' => true,
                'statistical' => false,
            ]);

        // check sort order
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room' => $room]).'?sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonPath('data.0.id', $meetings[5]->id);

        // check invalid sort order, fallback to default
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.meetings', ['room' => $room]).'?sort_direction=invalid')
            ->assertSuccessful()
            ->assertJsonPath('data.0.id', $meetings[0]->id);
    }

    /**
     * Test to list of meetings for a room
     */
    public function test_usage_statistics()
    {
        $this->generalSettings->pagination_page_size = 5;
        $this->generalSettings->save();
        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->save();

        // create room
        $meeting = Meeting::factory()->create(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:18:23']);

        // create meetings for room
        $stats = [];
        $stats[] = new MeetingStat(['participant_count' => 1, 'listener_count' => 0, 'voice_participant_count' => 0, 'video_count' => 0, 'created_at' => '2020-01-01 08:13:00']);
        $stats[] = new MeetingStat(['participant_count' => 2, 'listener_count' => 1, 'voice_participant_count' => 1, 'video_count' => 0, 'created_at' => '2020-01-01 08:14:00']);
        $stats[] = new MeetingStat(['participant_count' => 3, 'listener_count' => 2, 'voice_participant_count' => 2, 'video_count' => 1, 'created_at' => '2020-01-01 08:15:00']);
        $stats[] = new MeetingStat(['participant_count' => 4, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 1, 'created_at' => '2020-01-01 08:16:00']);
        $stats[] = new MeetingStat(['participant_count' => 5, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 3, 'created_at' => '2020-01-01 08:17:00']);
        $stats[] = new MeetingStat(['participant_count' => 3, 'listener_count' => 3, 'voice_participant_count' => 3, 'video_count' => 4, 'created_at' => '2020-01-01 08:18:00']);
        $meeting->stats()->saveMany($stats);

        // check guests
        $this->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertForbidden();

        // check room user
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room moderator
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room co-owner
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertSuccessful();
        $meeting->room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // check content and sort order of response
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
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
                    ],
                ],
            ])
            ->assertJsonPath('data.0', [
                'id' => $stats[0]->id,
                'participant_count' => 1,
                'listener_count' => 0,
                'voice_participant_count' => 0,
                'video_count' => 0,
                'created_at' => $stats[0]->created_at->toJson(),
            ]);

        // check with meeting stats globally disabled
        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->save();
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.stats', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::FEATURE_DISABLED->value);
    }

    /**
     * Test attendance at a meetings for a room
     */
    public function test_attendance()
    {
        // create room
        $meeting = Meeting::factory()->create(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:35:23', 'record_attendance' => false]);

        // set firstname, lastname and email to fixes values to make api output predictable
        $this->user->firstname = 'Mable';
        $this->user->lastname = 'Torres';
        $this->user->email = 'm.torres@example.net';
        $this->user->save();
        $meeting->room->owner->firstname = 'Gregory';
        $meeting->room->owner->lastname = 'Dumas';
        $meeting->room->owner->email = 'g.dumas@example.net';
        $meeting->room->owner->save();

        // add attendance data
        // one and multiple sessions for guests and users each
        $attendees = [];
        $attendees[] = new MeetingAttendee(['name' => 'Marie Walker', 'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb', 'join' => '2020-01-01 08:13:11', 'leave' => '2020-01-01 08:15:51']);
        $attendees[] = new MeetingAttendee(['name' => 'Marie Walker', 'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb', 'join' => '2020-01-01 08:17:23', 'leave' => '2020-01-01 08:29:05']);
        $attendees[] = new MeetingAttendee(['name' => 'Bertha Luff', 'session_id' => 'LQC1Pb5TSBn2EM5njylocogXPgIQIknKQcvcWMRG', 'join' => '2020-01-01 08:15:11', 'leave' => '2020-01-01 08:32:09']);
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:14:15', 'leave' => '2020-01-01 08:30:40']);
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:31:07', 'leave' => '2020-01-01 08:35:23']);
        $attendees[] = new MeetingAttendee(['user_id' => $meeting->room->owner->id, 'join' => '2020-01-01 08:12:45', 'leave' => '2020-01-01 08:35:23']);
        $meeting->attendees()->saveMany($attendees);

        // check guests
        $this->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertForbidden();

        // check room user
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room moderator
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room co-owner
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::MEETING_ATTENDANCE_DISABLED->value);
        $meeting->room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::MEETING_ATTENDANCE_DISABLED->value);
        $this->role->permissions()->detach($this->viewAllPermission);

        // check as owner
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::MEETING_ATTENDANCE_DISABLED->value);

        // enable record attendance for meeting
        $meeting->record_attendance = true;
        $meeting->save();

        // check with enabled record attendance
        // check content and order by name
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    [
                        'name' => 'Bertha Luff',
                        'email' => null,
                        'duration' => 16,
                        'sessions' => [
                            [
                                'id' => $attendees[2]->id,
                                'join' => '2020-01-01T08:15:11.000000Z',
                                'leave' => '2020-01-01T08:32:09.000000Z',
                                'duration' => 16,
                            ],
                        ],
                    ],
                    [
                        'name' => 'Gregory Dumas',
                        'email' => 'g.dumas@example.net',
                        'duration' => 22,
                        'sessions' => [
                            [
                                'id' => $attendees[5]->id,
                                'join' => '2020-01-01T08:12:45.000000Z',
                                'leave' => '2020-01-01T08:35:23.000000Z',
                                'duration' => 22,
                            ],
                        ],
                    ],
                    [
                        'name' => 'Mable Torres',
                        'email' => 'm.torres@example.net',
                        'duration' => 20,
                        'sessions' => [
                            [
                                'id' => $attendees[3]->id,
                                'join' => '2020-01-01T08:14:15.000000Z',
                                'leave' => '2020-01-01T08:30:40.000000Z',
                                'duration' => 16,
                            ],
                            [
                                'id' => $attendees[4]->id,
                                'join' => '2020-01-01T08:31:07.000000Z',
                                'leave' => '2020-01-01T08:35:23.000000Z',
                                'duration' => 4,
                            ],
                        ],
                    ],
                    [
                        'name' => 'Marie Walker',
                        'email' => null,
                        'duration' => 13,
                        'sessions' => [
                            [
                                'id' => $attendees[0]->id,
                                'join' => '2020-01-01T08:13:11.000000Z',
                                'leave' => '2020-01-01T08:15:51.000000Z',
                                'duration' => 2,
                            ],
                            [
                                'id' => $attendees[1]->id,
                                'join' => '2020-01-01T08:17:23.000000Z',
                                'leave' => '2020-01-01T08:29:05.000000Z',
                                'duration' => 11,
                            ],
                        ],
                    ],
                ],
            ]);

        // make meeting still running
        $meeting->end = null;
        $meeting->save();

        // check with for running meeting
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::MEETING_ATTENDANCE_NOT_ENDED->value);
    }

    /**
     * Test attendance at a meetings for a room without any guests
     */
    public function test_attendance_without_guests()
    {
        // create room
        $meeting = Meeting::factory()->create(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:35:23', 'record_attendance' => true]);

        // set firstname, lastname and email to fixes values to make api output predictable
        $this->user->firstname = 'Mable';
        $this->user->lastname = 'Torres';
        $this->user->email = 'm.torres@example.net';
        $this->user->save();
        $meeting->room->owner->firstname = 'Gregory';
        $meeting->room->owner->lastname = 'Dumas';
        $meeting->room->owner->email = 'g.dumas@example.net';
        $meeting->room->owner->save();

        // add attendance data
        // one and multiple sessions
        $attendees = [];
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:14:15', 'leave' => '2020-01-01 08:30:40']);
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:31:07', 'leave' => '2020-01-01 08:35:23']);
        $attendees[] = new MeetingAttendee(['user_id' => $meeting->room->owner->id, 'join' => '2020-01-01 08:12:45', 'leave' => '2020-01-01 08:35:23']);
        $meeting->attendees()->saveMany($attendees);

        // check content and order by name
        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.meetings.attendance', ['meeting' => $meeting]))
            ->assertSuccessful()
            ->assertJson([
                'data' => [
                    [
                        'name' => 'Gregory Dumas',
                        'email' => 'g.dumas@example.net',
                        'duration' => 22,
                        'sessions' => [
                            [
                                'id' => $attendees[2]->id,
                                'join' => '2020-01-01T08:12:45.000000Z',
                                'leave' => '2020-01-01T08:35:23.000000Z',
                                'duration' => 22,
                            ],
                        ],
                    ],
                    [
                        'name' => 'Mable Torres',
                        'email' => 'm.torres@example.net',
                        'duration' => 20,
                        'sessions' => [
                            [
                                'id' => $attendees[0]->id,
                                'join' => '2020-01-01T08:14:15.000000Z',
                                'leave' => '2020-01-01T08:30:40.000000Z',
                                'duration' => 16,
                            ],
                            [
                                'id' => $attendees[1]->id,
                                'join' => '2020-01-01T08:31:07.000000Z',
                                'leave' => '2020-01-01T08:35:23.000000Z',
                                'duration' => 4,
                            ],
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Test attendance download at a meetings for a room
     */
    public function test_attendance_download()
    {
        // create room
        $meeting = Meeting::factory()->create(['start' => '2020-01-01 08:12:45', 'end' => '2020-01-01 08:35:23', 'record_attendance' => false]);

        // set firstname, lastname and email to fixes values to make api output predictable
        $this->user->firstname = 'Mable';
        $this->user->lastname = 'Torres';
        $this->user->email = 'm.torres@example.net';
        $this->user->save();
        $meeting->room->owner->firstname = 'Gregory';
        $meeting->room->owner->lastname = 'Dumas';
        $meeting->room->owner->email = 'g.dumas@example.net';
        $meeting->room->owner->save();

        // add attendance data
        // one and multiple sessions for guests and users each
        $attendees = [];
        $attendees[] = new MeetingAttendee(['name' => 'Marie Walker', 'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb', 'join' => '2020-01-01 08:13:11', 'leave' => '2020-01-01 08:15:51']);
        $attendees[] = new MeetingAttendee(['name' => 'Marie Walker', 'session_id' => 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb', 'join' => '2020-01-01 08:17:23', 'leave' => '2020-01-01 08:29:05']);
        $attendees[] = new MeetingAttendee(['name' => 'Bertha Luff', 'session_id' => 'LQC1Pb5TSBn2EM5njylocogXPgIQIknKQcvcWMRG', 'join' => '2020-01-01 08:15:11', 'leave' => '2020-01-01 08:32:09']);
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:14:15', 'leave' => '2020-01-01 08:30:40']);
        $attendees[] = new MeetingAttendee(['user_id' => $this->user->id, 'join' => '2020-01-01 08:31:07', 'leave' => '2020-01-01 08:35:23']);
        $attendees[] = new MeetingAttendee(['user_id' => $meeting->room->owner->id, 'join' => '2020-01-01 08:12:45', 'leave' => '2020-01-01 08:35:23']);
        $meeting->attendees()->saveMany($attendees);

        // check guests
        $this->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertUnauthorized();

        // check authorized users
        $this->actingAs($this->user)->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertForbidden();

        // check room user
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room moderator
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::MODERATOR]);
        $this->actingAs($this->user)->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertForbidden();
        $meeting->room->members()->detach($this->user);

        // check room co-owner
        $meeting->room->members()->attach($this->user, ['role' => RoomUserRole::CO_OWNER]);
        $this->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::FEATURE_DISABLED->value);
        $meeting->room->members()->detach($this->user);

        // check view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::FEATURE_DISABLED->value);
        $this->role->permissions()->detach($this->viewAllPermission);

        // check as owner
        $this->actingAs($meeting->room->owner)->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::FEATURE_DISABLED->value);

        // enable record attendance for meeting
        $meeting->record_attendance = true;
        $meeting->save();

        // check with enabled record attendance
        // check successful download
        $response = $this->actingAs($meeting->room->owner)->get(route('download.attendance', ['meeting' => $meeting]))
            ->assertSuccessful();

        // Validate headers
        $response->assertHeader('content-disposition', 'attachment; filename='.__('meetings.attendance.filename').'.xlsx');
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Get file from download response and parse file back to array
        $file = $response->getFile();
        $array = (new AttendanceExcelImport)->toArray($file->getPathname());

        // Assert if the excel file content is correct
        $this->assertEquals(
            [
                [
                    [
                        __('rooms.name'),
                        $meeting->room->name,
                        null,
                        null,
                    ],
                    [
                        __('meetings.start'),
                        '01.01.2020 08:12:45',
                        null,
                        null,
                    ],
                    [
                        __('meetings.end'),
                        '01.01.2020 08:35:23',
                        null,
                        null,
                    ],
                    [null, null, null, null],
                    [
                        __('app.user_name'),
                        __('app.email'),
                        __('meetings.attendance.duration'),
                        __('meetings.attendance.sessions')],
                    [
                        'Bertha Luff',
                        null,
                        __('meetings.attendance.duration_minute', ['duration' => 16]),
                        '01.01.2020 08:15:11 -  01.01.2020 08:32:09 ('.__('meetings.attendance.duration_minute', ['duration' => 16]).')',
                    ],
                    [
                        'Gregory Dumas',
                        'g.dumas@example.net',
                        __('meetings.attendance.duration_minute', ['duration' => 22]),
                        '01.01.2020 08:12:45 -  01.01.2020 08:35:23 ('.__('meetings.attendance.duration_minute', ['duration' => 22]).')'],
                    [
                        'Mable Torres',
                        'm.torres@example.net',
                        __('meetings.attendance.duration_minute', ['duration' => 20]),
                        '01.01.2020 08:14:15 -  01.01.2020 08:30:40 ('.__('meetings.attendance.duration_minute', ['duration' => 16]).")\n01.01.2020 08:31:07 -  01.01.2020 08:35:23 (".__('meetings.attendance.duration_minute', ['duration' => 4]).')'],
                    [
                        'Marie Walker',
                        null,
                        __('meetings.attendance.duration_minute', ['duration' => 13]),
                        '01.01.2020 08:13:11 -  01.01.2020 08:15:51 ('.__('meetings.attendance.duration_minute', ['duration' => 2]).")\n01.01.2020 08:17:23 -  01.01.2020 08:29:05 (".__('meetings.attendance.duration_minute', ['duration' => 11]).')'],
                ],
            ],
            $array
        );

        // Remove temp. file
        \File::delete($file->getPathname());

        // make meeting still running
        $meeting->end = null;
        $meeting->save();

        // check with for running meeting
        $this->actingAs($meeting->room->owner)->getJson(route('download.attendance', ['meeting' => $meeting]))
            ->assertStatus(CustomStatusCodes::MEETING_ATTENDANCE_NOT_ENDED->value);
    }
}
