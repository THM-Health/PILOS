<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
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
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\Backend\TestCase;
use Tests\Backend\Unit\Console\helper\Greenlight2Presentation;
use Tests\Backend\Unit\Console\helper\Greenlight2Room;
use Tests\Backend\Unit\Console\helper\Greenlight2SharedAccess;
use Tests\Backend\Unit\Console\helper\Greenlight2User;

class ImportGreenlight2Test extends TestCase
{
    use RefreshDatabase, WithFaker;

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
     * @param  bool  $roomAuth  Authentication feature flag
     * @param  Collection  $users  Collection of Greenlight2Users
     * @param  Collection  $rooms  Collection Collection of Greenlight2Rooms
     * @param  Collection  $sharedAccesses  Collection Collection of Greenlight2SharedAccesses
     * @param  Collection  $presentations  Collection Collection of Greenlight2Presentations
     */
    private function fakeDatabase(bool $roomAuth, Collection $users, Collection $rooms, Collection $sharedAccesses, Collection $presentations)
    {
        // preserve DB default
        $connection = DB::connection();

        DB::shouldReceive('connection')
            ->with(null)
            ->andReturn($connection);

        // mock connection to greenlight postgres database and queries
        DB::shouldReceive('connection')
            ->with('greenlight')
            ->andReturn(Mockery::mock('Illuminate\Database\Connection', function ($mock) use ($sharedAccesses, $rooms, $users, $roomAuth, $presentations) {
                $mock->shouldReceive('table')
                    ->with('features')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($roomAuth) {
                        $mock->shouldReceive('where')
                            ->with('name', 'Room Authentication')
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($roomAuth) {
                                $mock->shouldReceive('first')
                                    ->with('value')
                                    ->andReturn((object) ['value' => $roomAuth]);
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('users')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                        $mock->shouldReceive('where')
                            ->with('deleted', false)
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                $mock->shouldReceive('get')
                                    ->with(['id', 'provider', 'username', 'social_uid', 'email', 'name', 'password_digest'])
                                    ->andReturn($users);
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('rooms')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($rooms) {
                        $mock->shouldReceive('where')
                            ->with('deleted', false)
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($rooms) {
                                $mock->shouldReceive('get')
                                    ->with(['id', 'uid', 'bbb_id', 'user_id', 'name', 'room_settings', 'access_code'])
                                    ->andReturn($rooms);
                            }));
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
                    ->with('users')
                    ->once()
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                        $mock->shouldReceive('select')
                            ->with('provider')
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                $mock->shouldReceive('whereNotIn')
                                    ->with('provider', ['greenlight', 'ldap'])
                                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                        $mock->shouldReceive('distinct')
                                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                                $mock->shouldReceive('get')
                                                    ->andReturn($users->unique('provider')->whereNotIn('provider', ['greenlight', 'ldap'])->map(function ($user) {
                                                        return (object) ['provider' => $user->provider];
                                                    }));
                                            }));
                                    }));
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
                                        ->with('active_storage_attachments.record_id', $pres->room_id)
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
        $command = 'import:greenlight-v2 '.implode(' ', $cmdOptions).' '.$cmdArgs;

        return $expectHook($this->artisan($command));
    }

    /**
     * Helper function for running the command with a fake database
     *
     * @param  array  $cmdOptions  Command line options
     * @param  callable  $expectHook  Hook with expectations to check
     * @param  bool  $roomAuth  Room authentication
     * @param  string|null  $prefix  Room prefix
     */
    protected function test_helper_full(array $cmdOptions, callable $expectHook, bool $roomAuth, ?string $prefix = null)
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

        // Create ldap user that exists before import
        $existingLdapUser = new User;
        $existingLdapUser->authenticator = 'ldap';
        $existingLdapUser->external_id = 'djohn';
        $existingLdapUser->firstname = 'John';
        $existingLdapUser->lastname = 'Doe';
        $existingLdapUser->email = 'john.doe@domain.tld';
        $existingLdapUser->password = $password;
        $existingLdapUser->save();

        // Create shibboleth user that exists before import
        $existingShibbolethUser = new User;
        $existingShibbolethUser->authenticator = 'shibboleth';
        $existingShibbolethUser->external_id = 'djohn';
        $existingShibbolethUser->firstname = 'John';
        $existingShibbolethUser->lastname = 'Doe';
        $existingShibbolethUser->email = 'john.doe@domain.tld';
        $existingShibbolethUser->password = $password;
        $existingShibbolethUser->save();

        // Create room that exists before import
        $existingRoom = new Room;
        $existingRoom->name = 'Existing room 1';
        $existingRoom->roomType()->associate(RoomType::all()->first());
        $existingRoom->owner()->associate($existingUser);
        $existingRoom->save();

        // Create fake users, ldap users and social users
        $users = [];
        $users[] = new Greenlight2User(1, 'greenlight', 'John Doe', null, null, 'john.doe@domain.tld', $password);
        $users[] = new Greenlight2User(2, 'greenlight', 'John Doe', null, null, 'john@domain.tld', $password);
        $users[] = new Greenlight2User(3, 'ldap', 'John Doe', 'djohn', 'uid=djohn,ou=People,dc=university,dc=org', 'john.doe@domain.tld', null);
        $users[] = new Greenlight2User(4, 'ldap', 'John Doe', 'doejohn', 'uid=doejohn,ou=People,dc=university,dc=org', 'john@domain.tld', null);
        $users[] = new Greenlight2User(5, 'shibboleth', 'John Doe', null, 'djohn', 'john@domain.tld', null);
        $users[] = new Greenlight2User(6, 'google', 'John Doe', null, '4696234782348234734', 'john@domain.tld', null);

        // Create fake rooms
        $rooms = [];
        $rooms[] = new Greenlight2Room(1, 'abc-def-xyz-123', 'thue5aivaiyohreetu1zaipe4iez7eengoopoohi', 'Test Room 1', $users[0]->id);
        $rooms[] = new Greenlight2Room(2, 'abc-def-xyz-234', 'aef9eiquoo8oph9oon4oovit8oid9ree7caigahw', 'Test Room 2', $users[1]->id);
        $rooms[] = new Greenlight2Room(3, 'abc-def-xyz-345', 'iekoongaicahhaivah0xaud3tha3iem8eathoaxu', 'Test Room 3', $users[2]->id);
        $rooms[] = new Greenlight2Room(4, 'abc-def-xyz-456', 'oeph7ohhoochoy7ruoshae9uephie0tha8aup3oo', 'Test Room 4', $users[3]->id);
        $rooms[] = new Greenlight2Room(5, 'abc-def-xyz-567', 'eecae0kugoo3aes2aiquaif8aeraiy1aiva2ohje', 'Test Room 5', $users[4]->id);
        $rooms[] = new Greenlight2Room(6, 'abc-def-xyz-678', 'eizaipaikohheizohvaehiech5ach3el9haech5g', 'Test Room 6', $users[5]->id);

        $rooms[] = new Greenlight2Room(7, 'hij-klm-xyz-123', 'aebaoj6phak4eaghoizeiwaecudei6hishochua7', 'Test Room 7', $users[0]->id, '012345', ['muteOnStart' => false, 'requireModeratorApproval' => true, 'anyoneCanStart' => false, 'joinModerator' => true]);
        $rooms[] = new Greenlight2Room(8, 'hij-klm-xyz-234', 'aicha2vahw1zei7aecoo1ainoph1ietei3nei4la', 'Test Room 8', $users[0]->id, null, ['muteOnStart' => true, 'requireModeratorApproval' => false, 'anyoneCanStart' => true, 'joinModerator' => false]);
        $rooms[] = new Greenlight2Room(9, 'hij-klm-xyz-456', 'quohseseey2aheicoc3eedaedei4kif8zo4xaiki', 'Test Room 9', 99, '012345');
        $rooms[] = new Greenlight2Room(10, $existingRoom->id, 'aima0eiv6uyaif6ien8ahchoothohkeiphaegh0u', 'Test Room 10', $users[0]->id);

        // Create fake presentations
        $presentations = [];
        $presentations[] = new Greenlight2Presentation(1, 'feen6movahheegheeg0ovahche8bu3mo', '1testvongpresiher.pdf');
        $presentations[] = new Greenlight2Presentation(2, 'xivei7mi0cohtoecacahyaich8ohzaed', '2testvongpresiher.pdf');
        $presentations[] = new Greenlight2Presentation(3, '20yeie1yac7uy8pnjbpr44oaxbir424i', '3testvongpresiher.pdf');

        // Create fake shared accesses
        $sharedAccesses = [];
        $sharedAccesses[] = new Greenlight2SharedAccess(1, 1, 2);
        $sharedAccesses[] = new Greenlight2SharedAccess(2, 1, 3);  // shared access should be applied for existing users
        $sharedAccesses[] = new Greenlight2SharedAccess(2, 1, 4);
        $sharedAccesses[] = new Greenlight2SharedAccess(3, 1, 99); // invalid user id
        $sharedAccesses[] = new Greenlight2SharedAccess(6, 9, 1);  // room that has an invalid owner
        $sharedAccesses[] = new Greenlight2SharedAccess(7, 10, 1);  // room that already exists should not be modified

        // Mock database connections with fake data
        $this->fakeDatabase($roomAuth, new Collection($users), new Collection($rooms), new Collection($sharedAccesses), new Collection($presentations));

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

        // check amount of rooms and users
        $this->assertCount(9, Room::all());
        $this->assertCount(8, Meeting::all());
        $this->assertCount(2, User::where('authenticator', 'local')->get());
        $this->assertCount(2, User::where('authenticator', 'ldap')->get());
        $this->assertCount(1, User::where('authenticator', 'shibboleth')->get());
        $this->assertCount(1, User::where('authenticator', 'oidc')->get());

        // check if all rooms are created
        $this->assertEqualsCanonicalizing(
            [$existingRoom->id, 'abc-def-xyz-123', 'abc-def-xyz-234', 'abc-def-xyz-345', 'abc-def-xyz-456', 'abc-def-xyz-567', 'abc-def-xyz-678', 'hij-klm-xyz-123', 'hij-klm-xyz-234'],
            Room::all()->pluck('id')->toArray()
        );

        // check if all meetings are created
        $this->assertEqualsCanonicalizing(
            [
                'thue5aivaiyohreetu1zaipe4iez7eengoopoohi',
                'aef9eiquoo8oph9oon4oovit8oid9ree7caigahw',
                'iekoongaicahhaivah0xaud3tha3iem8eathoaxu',
                'oeph7ohhoochoy7ruoshae9uephie0tha8aup3oo',
                'eecae0kugoo3aes2aiquaif8aeraiy1aiva2ohje',
                'eizaipaikohheizohvaehiech5ach3el9haech5g',
                'aebaoj6phak4eaghoizeiwaecudei6hishochua7',
                'aicha2vahw1zei7aecoo1ainoph1ietei3nei4la',
            ],
            Meeting::all()->pluck('id')->toArray()
        );

        // check if allow guest setting is correct
        foreach (Room::where('id', '!=', $existingRoom->id)->get() as $room) {
            $this->assertEquals(! $roomAuth, $room->allow_guests);
        }

        // check access code
        $this->assertNull(Room::find('abc-def-xyz-123')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-234')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-345')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-456')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-567')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-678')->access_code);
        $this->assertEquals('012345', Room::find('hij-klm-xyz-123')->access_code);
        $this->assertNull(Room::find('hij-klm-xyz-234')->access_code);

        // check expert mode is enabled for all rooms
        foreach (Room::where('id', '!=', $existingRoom->id)->get() as $room) {
            $this->assertTrue($room->expert_mode);
        }

        // check room settings
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
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'ldap')->where('external_id', 'djohn')->first(), Room::find('abc-def-xyz-345')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'ldap')->where('external_id', 'doejohn')->first(), Room::find('abc-def-xyz-456')->owner);
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'shibboleth')->where('external_id', 'djohn')->first(), Room::find('abc-def-xyz-567')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'oidc')->where('external_id', '4696234782348234734')->first(), Room::find('abc-def-xyz-678')->owner);

        // Testing users
        $this->assertNotNull(User::where([['authenticator', 'ldap'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', 'djohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'ldap'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', 'doejohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'shibboleth'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', 'djohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'oidc'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', '4696234782348234734']])->first());
        $this->assertNotNull(User::where([['authenticator', 'local'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', null], ['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'local'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', null], ['password', $password]])->first());

        // Testing user roles for new non ldap-users
        $this->assertEquals(['student'], User::where([['authenticator', 'local'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', null], ['password', $password]])->first()->roles->pluck('name')->toArray());

        // Testing ldap, social users and existing users dont get a default role assigned
        $this->assertCount(0, User::where([['authenticator', 'ldap'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', 'doejohn']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'ldap'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', 'djohn']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'shibboleth'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', 'djohn']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'oidc'], ['firstname', 'John Doe'], ['lastname', ''], ['email', 'john@domain.tld'], ['external_id', '4696234782348234734']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'local'], ['firstname', 'John'], ['lastname', 'Doe'], ['email', 'john.doe@domain.tld'], ['external_id', null], ['password', $password]])->first()->roles);

        // Testing room memberships (should be moderator, as that is the greenlight equivalent)
        $this->assertCount(3, Room::find('abc-def-xyz-123')->members);
        foreach (Room::find('abc-def-xyz-123')->members as $member) {
            $this->assertEquals(RoomUserRole::MODERATOR, $member->pivot->role);
        }
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'local')->first()));
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'ldap')->where('external_id', 'doejohn')->first()));
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'ldap')->where('external_id', 'djohn')->first()));
    }

    public function test_interactive()
    {
        $roomTypeId = RoomType::where('name', 'Lecture')->first()->id;
        $userRoleId = Role::where('name', 'student')->first()->id;
        $prefix = 'GL2 ::';
        $expectations = function ($command) use ($roomTypeId, $userRoleId, $prefix) {
            $command->expectsQuestion('What room type should the rooms be assigned to?', $roomTypeId)
                ->expectsQuestion('Prefix for room names', $prefix)
                ->expectsQuestion('Please select the default role for new imported local users', $userRoleId)
                ->expectsQuestion('Path to GL2 room presentations', 'migration/presentations')
                ->expectsQuestion('Please select the authenticator for the social provider: shibboleth', 'shibboleth')
                ->expectsQuestion('Please select the authenticator for the social provider: google', 'oidc')
                ->expectsOutput('Importing users')
                ->expectsOutput('3 created, 3 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('8 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'ID', 'Access code'], [['Test Room 9', 'hij-klm-xyz-456', '012345']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->expectsQuestion('Do you wish to commit the import?', 'yes')
                ->expectsOutput('Import completed')
                ->assertSuccessful();
        };
        $this->test_helper_full([], $expectations, false, $prefix);
    }

    public function test_non_interactive()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Importing users')
                ->expectsOutput('3 created, 3 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('8 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'ID', 'Access code'], [['Test Room 9', 'hij-klm-xyz-456', '012345']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->assertSuccessful();
        };
        $this->test_helper_full($cmd_options, $expectations, false);
    }

    public function test_non_interactive_with_room_auth()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Importing users')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->assertSuccessful();
        };
        $this->test_helper_full($cmd_options, $expectations, true);
    }

    public function test_rollback()
    {
        $cmd_options = [
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Importing users')
                ->expectsOutput('3 created, 3 skipped (already existed)')
                ->expectsOutput('Importing rooms')
                ->expectsOutput('8 created, 1 skipped (already existed)')
                ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
                ->expectsTable(['Name', 'ID', 'Access code'], [['Test Room 9', 'hij-klm-xyz-456', '012345']])
                ->expectsOutput('Importing presentations for rooms')
                ->expectsOutput('2 created, 1 skipped (file not found)')
                ->expectsOutput('Importing shared room accesses')
                ->expectsOutput('3 created, 3 skipped (user or room not found)')
                ->expectsConfirmation('Do you wish to commit the import?', 'no')
                ->expectsOutput('Import canceled; nothing was imported')
                ->assertSuccessful();

            return 1;
        };
        $this->test_helper_full($cmd_options, $expectations, false);
    }

    public function test_invalid_auth_provider_map()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            '--auth-provider-map={"shibboleth":"shibboleth","google":"oidc"}',
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: Cannot parse --auth-provider-map JSON')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }

    public function test_invalid_authenticator()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"invalid\"}'",
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: Unsupported authenticator "invalid"')
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
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
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
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
            '--presentation-path=migration/presentations',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: No query results for model [App\Models\RoomType].')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }

    public function test_non_existing_presentation_dir()
    {
        $cmd_options = [
            '--no-confirm',
            '--default-role=student',
            '--room-prefix=""',
            '--room-type=Lecture',
            "--auth-provider-map='{\"shibboleth\":\"shibboleth\",\"google\":\"oidc\"}'",
            '--presentation-path=NXDIR',
        ];
        $expectations = function ($command) {
            $command->expectsOutput('Import failed: Cannot read presentation directory at NXDIR')
                ->assertFailed();
        };
        $this->test_helper_command($cmd_options, $expectations);
    }
}
