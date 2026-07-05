<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit\Console;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\Backend\TestCase;
use Tests\Backend\Unit\Console\helper\Greenlight3Presentation;
use Tests\Backend\Unit\Console\helper\Greenlight3Room;
use Tests\Backend\Unit\Console\helper\Greenlight3SharedAccess;
use Tests\Backend\Unit\Console\helper\Greenlight3User;

class ImportGreenlight3Test extends TestCase
{
    use RefreshDatabase;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate([
            'name' => 'admin',
        ]);

        Role::firstOrCreate([
            'name' => 'student',
        ]);
    }

    /**
     * Mock DB with fake response of the postgres database
     *
     * @param  Collection  $users  Collection of Users
     * @param  Collection  $rooms  Collection of Rooms
     * @param  Collection  $sharedAccesses  Collection Collection of SharedAccesses
     * @param  Collection  $presentations  Collection of presentations
     */
    private function fakeDatabase(Collection $users, Collection $rooms, Collection $sharedAccesses, Collection $presentations)
    {
        // preserve DB default
        $connection = DB::connection();

        DB::shouldReceive('connection')
            ->with(null)
            ->andReturn($connection);

        // mock connection to greenlight postgres database and queries
        DB::shouldReceive('connection')
            ->with('greenlight')
            ->andReturn(Mockery::mock('Illuminate\Database\Connection', function ($mock) use ($presentations, $sharedAccesses, $rooms, $users) {
                $mock->shouldReceive('table')
                    ->with('users')
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                        $mock->shouldReceive('where')
                            ->with('provider', 'greenlight')
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                $mock->shouldReceive('get')
                                    ->with(['id', 'name', 'email', 'external_id', 'password_digest'])
                                    ->andReturn($users);
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('rooms')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($rooms) {
                        $mock->shouldReceive('get')
                            ->with(['id', 'friendly_id', 'meeting_id', 'user_id', 'name'])
                            ->andReturn($rooms);
                    }));

                $mock->shouldReceive('table')
                    ->with('shared_accesses')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($sharedAccesses) {
                        $mock->shouldReceive('get')
                            ->with(['room_id', 'user_id'])
                            ->andReturn($sharedAccesses);
                    }));

                $mock->shouldReceive('table')
                    ->with('room_meeting_options')
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) {
                        $mock->shouldReceive('join')
                            ->with('meeting_options', 'meeting_option_id', '=', 'meeting_options.id')
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) {
                                $roomOptions = [
                                    1 => [],
                                    2 => [],
                                    3 => [
                                        (object) [
                                            'name' => 'record',
                                            'value' => 'true',
                                        ],
                                        (object) [
                                            'name' => 'glRequireAuthentication',
                                            'value' => 'false',
                                        ],
                                    ],
                                    4 => [],
                                    5 => [
                                        (object) [
                                            'name' => 'glViewerAccessCode',
                                            'value' => '012345abcd',
                                        ],
                                        (object) [
                                            'name' => 'guestPolicy',
                                            'value' => 'ASK_MODERATOR',
                                        ],
                                        (object) [
                                            'name' => 'glAnyoneJoinAsModerator',
                                            'value' => 'true',
                                        ],
                                    ],
                                    6 => [
                                        (object) [
                                            'name' => 'muteOnStart',
                                            'value' => 'true',
                                        ],
                                        (object) [
                                            'name' => 'glAnyoneCanStart',
                                            'value' => 'true',
                                        ],
                                    ],
                                    7 => [],
                                    8 => [],
                                ];
                                foreach ($roomOptions as $i => $options) {
                                    $mock->shouldReceive('where')
                                        ->with('room_id', $i)
                                        ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($options) {
                                            $mock->shouldReceive('get')
                                                ->with(['name', 'value'])
                                                ->andReturn($options);
                                        }));
                                }
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('active_storage_blobs')
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($presentations) {
                        $mock->shouldReceive('join')
                            ->with('active_storage_attachments', 'active_storage_blobs.id', '=', 'active_storage_attachments.blob_id')
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($presentations) {
                                foreach ($presentations as $pres) {
                                    $mock->shouldReceive('where')
                                        ->with([
                                            'active_storage_attachments.name' => 'presentation',
                                            'active_storage_attachments.record_type' => 'Room',
                                            'active_storage_attachments.record_id' => $pres->room_id,
                                        ])
                                        ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($pres) {
                                            $mock->shouldReceive('get')
                                                ->with(['filename', 'key'])
                                                ->andReturn([$pres]);
                                        }));
                                }
                                $mock->shouldReceive('where')
                                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) {
                                        $mock->shouldReceive('get')
                                            ->with(['filename', 'key'])
                                            ->andReturn([]);
                                    }));
                            }));
                    }));
            }));

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack');
        DB::shouldReceive('commit');
    }

    /**
     * Helper function for running the command without setting up a fake database
     *
     * @param  array  $cmdOptions  Command line options
     * @param  callable  $expectHook  Hook with expectations to check
     * @return int|null Return value of the hook function
     */
    protected function test_helper_command(array $cmdOptions, callable $expectHook): ?int
    {
        $cmdArgs = 'localhost 5432 greenlight_production postgres 12345678';
        $command = 'import:greenlight-v3 '.implode(' ', $cmdOptions).' '.$cmdArgs;

        return $expectHook($this->artisan($command));
    }

    /**
     * Helper function for running the command with a fake database
     *
     * @param  array  $cmdOptions  Command line options
     * @param  callable  $expectHook  Hook with expectations to check
     * @param  string|null  $prefix  Room prefix
     */
    protected function test_helper_full(array $cmdOptions, callable $expectHook, ?string $prefix = null)
    {
        // Password for all users
        $password = Hash::make('secret');

        // Create user that exists before import
        $existingUser = new User;
        $existingUser->firstname = 'John';
        $existingUser->lastname = 'Doe';
        $existingUser->email = 'john.doe@domain.tld';
        $existingUser->password = $password;
        $existingUser->save();

        // Create room that exists before import
        $existingRoom = new Room;
        $existingRoom->name = 'Existing room 1';
        $existingRoom->roomType()->associate(RoomType::all()->first());
        $existingRoom->owner()->associate($existingUser);
        $existingRoom->save();

        // Create fake users, ldap users and social users
        $users = [];
        $users[] = new Greenlight3User('1', 'John Doe', 'john.doe@domain.tld', null, $password);
        $users[] = new Greenlight3User('2', 'John Doe', 'john@domain.tld', null, $password);
        $users[] = new Greenlight3User('3', 'John Doe', 'j.doe@domain.tld', '79b3db28-31a9-42bf-ac9a-49bdf13b6cc1', null);
        $users[] = new Greenlight3User('4', 'John Doe', 'j.doe@domain.tld', null, $password);

        // Create fake rooms
        $rooms = [];
        $rooms[] = new Greenlight3Room('1', 'abc-def-xyz-123', 'kah3caebohzosei4ohd5vadai5xeech4iephieha', 'Test Room 1', $users[0]->id);
        $rooms[] = new Greenlight3Room('2', 'abc-def-xyz-234', 'shuuchuk3ahchu2xai3hienae1eghohngueleih9', 'Test Room 2', $users[1]->id);
        $rooms[] = new Greenlight3Room('3', 'abc-def-xyz-345', 'aepoh2etaira5ahjootoh2naedahno6fieghaibi', 'Test Room 3', $users[2]->id);
        $rooms[] = new Greenlight3Room('4', 'abc-def-xyz-456', 'jee8sha6koh9iechik4thohjahv2biedua8shiep', 'Test Room 4', $users[3]->id);
        $rooms[] = new Greenlight3Room('5', 'hij-klm-xyz-123', 'jiel3oe0gohvohmei2aew0ooghahwiejaileeghu', 'Test Room 5', $users[0]->id);
        $rooms[] = new Greenlight3Room('6', 'hij-klm-xyz-234', 'ies7oroizuulaiqu3cheeshoogahh1mae1aew0ee', 'Test Room 6', $users[0]->id);
        $rooms[] = new Greenlight3Room('7', 'hij-klm-xyz-456', 'eu6ahs7eephahhain6thae6thodu7xoophooghei', 'Test Room 9', '99');
        $rooms[] = new Greenlight3Room('8', $existingRoom->id, 'gaezohvohsh6lougho8coongaebiech0wu6jukia', 'Test Room 10', $users[0]->id);

        // Create fake presentations
        $presentations = [];
        $presentations[] = new Greenlight3Presentation('1', 'feen6movahheegheeg0ovahche8bu3mo', '1testvongpresiher.pdf');
        $presentations[] = new Greenlight3Presentation('2', 'xivei7mi0cohtoecacahyaich8ohzaed', '2testvongpresiher.pdf');
        $presentations[] = new Greenlight3Presentation('3', '20yeie1yac7uy8pnjbpr44oaxbir424i', '3testvongpresiher.pdf');

        // Create fake shared accesses
        $sharedAccesses = [];
        $sharedAccesses[] = new Greenlight3SharedAccess('1', '1', '2');
        $sharedAccesses[] = new Greenlight3SharedAccess('2', '1', '3');  // shared access should be applied for existing users
        $sharedAccesses[] = new Greenlight3SharedAccess('3', '1', '4');

        $sharedAccesses[] = new Greenlight3SharedAccess('4', '1', '99'); // invalid user id
        $sharedAccesses[] = new Greenlight3SharedAccess('5', '7', '1');  // room that has an invalid owner
        $sharedAccesses[] = new Greenlight3SharedAccess('6', '8', '1');  // room that already exists should not be modified

        // Mock database connections with fake data
        $this->fakeDatabase(new Collection($users), new Collection($rooms), new Collection($sharedAccesses), new Collection($presentations));

        // Mock presentation files
        $storageMock = Storage::fake();
        $storageMock->put('migration/presentations/fe/en/feen6movahheegheeg0ovahche8bu3mo', 'Foobar test 123');
        $storageMock->put('migration/presentations/xi/ve/xivei7mi0cohtoecacahyaich8ohzaed', 'Foobar test 456');

        // Run artisan command and validate expectation hook
        $rollback = $this->test_helper_command($cmdOptions, $expectHook);

        if ($rollback) {
            // Check imported files are removed
            $this->assertEmpty($storageMock->files('abc-def-xyz-123'));
            $this->assertEmpty($storageMock->files('abc-def-xyz-234'));

            return;
        }

        // Check amount of users and rooms
        $this->assertCount(2, User::where('authenticator', 'local')->get());
        $this->assertCount(1, User::where('authenticator', 'oidc')->get());
        $this->assertCount(7, Room::all());

        // Check users
        $this->assertNotNull(User::where([['authenticator', 'local'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', null], ['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'local'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', null], ['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'oidc'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'j.doe@domain.tld'], ['external_id', '79b3db28-31a9-42bf-ac9a-49bdf13b6cc1']])->first());

        // Check user roles
        $this->assertEquals(['student'], User::where([['authenticator', 'local'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', null], ['password', $password]])->first()->roles->pluck('name')->toArray());

        // Check OIDC users and existing users don't get a default role assigned
        $this->assertCount(0, User::where([['authenticator', 'oidc'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'j.doe@domain.tld'], ['external_id', '79b3db28-31a9-42bf-ac9a-49bdf13b6cc1']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'local'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', null], ['password', $password]])->first()->roles);

        // Check if all rooms are created
        $this->assertEqualsCanonicalizing(
            [$existingRoom->id, 'abc-def-xyz-123', 'abc-def-xyz-234', 'abc-def-xyz-345', 'abc-def-xyz-456', 'hij-klm-xyz-123', 'hij-klm-xyz-234'],
            Room::all()->pluck('id')->toArray()
        );

        // Check if all meetings are created
        $this->assertEqualsCanonicalizing(
            [
                'kah3caebohzosei4ohd5vadai5xeech4iephieha',
                'shuuchuk3ahchu2xai3hienae1eghohngueleih9',
                'aepoh2etaira5ahjootoh2naedahno6fieghaibi',
                'jee8sha6koh9iechik4thohjahv2biedua8shiep',
                'jiel3oe0gohvohmei2aew0ooghahwiejaileeghu',
                'ies7oroizuulaiqu3cheeshoogahh1mae1aew0ee',
            ],
            Meeting::all()->pluck('id')->toArray()
        );

        // Check access code
        $this->assertNull(Room::find('abc-def-xyz-123')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-234')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-345')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-456')->access_code);
        $this->assertEquals('012345abcd', Room::find('hij-klm-xyz-123')->access_code);
        $this->assertNull(Room::find('hij-klm-xyz-234')->access_code);

        // check expert mode is enabled for all rooms
        foreach (Room::where('id', '!=', $existingRoom->id)->get() as $room) {
            $this->assertTrue($room->expert_mode);
        }

        // check room settings
        $this->assertFalse(Room::find('abc-def-xyz-234')->record);
        $this->assertFalse(Room::find('abc-def-xyz-234')->allow_guests);
        $this->assertTrue(Room::find('abc-def-xyz-345')->record);
        $this->assertTrue(Room::find('abc-def-xyz-345')->allow_guests);

        $this->assertFalse(Room::find('hij-klm-xyz-123')->mute_on_start);
        $this->assertFalse(Room::find('hij-klm-xyz-123')->everyone_can_start);
        $this->assertEquals(RoomLobby::ENABLED, Room::find('hij-klm-xyz-123')->lobby);
        $this->assertEquals(RoomUserRole::MODERATOR, Room::find('hij-klm-xyz-123')->default_role);

        $this->assertTrue(Room::find('hij-klm-xyz-234')->mute_on_start);
        $this->assertTrue(Room::find('hij-klm-xyz-234')->everyone_can_start);
        $this->assertEquals(RoomLobby::DISABLED, Room::find('hij-klm-xyz-234')->lobby);
        $this->assertEquals(RoomUserRole::USER, Room::find('hij-klm-xyz-234')->default_role);

        // Test room name prefix
        if (! is_null($prefix)) {
            $this->assertEquals($prefix.' Test Room 1', Room::find('abc-def-xyz-123')->name);
        } else {
            $this->assertEquals('Test Room 1', Room::find('abc-def-xyz-123')->name);
        }

        // Test presentations
        $this->assertTrue($storageMock->fileExists('migration/presentations/fe/en/feen6movahheegheeg0ovahche8bu3mo'));
        $this->assertTrue($storageMock->fileExists('migration/presentations/xi/ve/xivei7mi0cohtoecacahyaich8ohzaed'));
        $this->assertNotEmpty($storageMock->files('abc-def-xyz-123'));
        $this->assertNotEmpty($storageMock->files('abc-def-xyz-234'));
        $this->assertEquals('1testvongpresiher.pdf', Room::find('abc-def-xyz-123')->files()->first()->filename);
        $this->assertEquals('2testvongpresiher.pdf', Room::find('abc-def-xyz-234')->files()->first()->filename);
        $this->assertEmpty(Room::find('abc-def-xyz-345')->files()->get());
        $this->assertEmpty(Room::find('hij-klm-xyz-123')->files()->get());

        // Testing room ownership
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'local')->first(), Room::find('abc-def-xyz-123')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'local')->first(), Room::find('abc-def-xyz-234')->owner);
        $this->assertEquals(User::where('email', 'j.doe@domain.tld')->where('authenticator', 'oidc')->where('external_id', '79b3db28-31a9-42bf-ac9a-49bdf13b6cc1')->first(), Room::find('abc-def-xyz-345')->owner);

        // Testing room memberships (should be moderator, as that is the greenlight equivalent)
        $this->assertCount(2, Room::find('abc-def-xyz-123')->members);
        foreach (Room::find('abc-def-xyz-123')->members as $member) {
            $this->assertEquals(RoomUserRole::MODERATOR, $member->pivot->role);
        }
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'local')->first()));
    }

    public function test_interactive()
    {
        $roomTypeId = RoomType::where('name', 'Lecture')->first()->id;
        $userRoleId = Role::where('name', 'student')->first()->id;
        $prefix = 'GL3 ::';
        $expectations = function ($command) use ($roomTypeId, $userRoleId, $prefix) {
            $command->expectsQuestion('What room type should the rooms be assigned to?', $roomTypeId)
                ->expectsQuestion('Prefix for room names', $prefix)
                ->expectsQuestion('Please select the default role for new imported local users', $userRoleId)
                ->expectsQuestion('Path to GL3 room presentations', 'migration/presentations')
                ->expectsOutput('Importing users')
                ->expectsOutput('2 created, 2 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('6 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'Friendly ID'], [['Test Room 9', 'hij-klm-xyz-456']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->expectsConfirmation('Do you wish to commit the import?', 'yes')
                ->expectsOutput('Import completed')
                ->assertSuccessful();
        };
        $this->test_helper_full([], $expectations, $prefix);
    }

    public function test_non_interactive()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Importing users')
                ->expectsOutput('2 created, 2 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('6 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'Friendly ID'], [['Test Room 9', 'hij-klm-xyz-456']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->expectsOutput('Import completed')
                ->assertSuccessful();
        };
        $this->test_helper_full($cmd_options, $expectations);
    }

    public function test_rollback()
    {
        $cmd_options = [
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Importing users')
                ->expectsOutput('2 created, 2 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('6 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'Friendly ID'], [['Test Room 9', 'hij-klm-xyz-456']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->expectsConfirmation('Do you wish to commit the import?', 'no')
                ->expectsOutput('Import canceled; nothing was imported')
                ->assertSuccessful();

            return 1;
        };
        $this->test_helper_full($cmd_options, $expectations);
    }

    public function test_non_existing_presentation_dir()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            '--presentation-path=NXDIR',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: Cannot read presentation directory at NXDIR')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }

    public function test_invalid_default_role()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=NXROLE',
            '--room-prefix=""',
            '--room-type=Lecture',
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: No query results for model [App\Models\Role].')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }

    public function test_invalid_room_type()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=NXROOMTYPE',
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: No query results for model [App\Models\RoomType].')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }
}
