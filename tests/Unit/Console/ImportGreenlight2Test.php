<?php

namespace Tests\Unit\Console;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use DB;
use Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Collection;
use Mockery;
use Tests\TestCase;
use Tests\Unit\Console\helper\GreenlightRoom;
use Tests\Unit\Console\helper\GreenlightSharedAccess;
use Tests\Unit\Console\helper\GreenlightUser;

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
            'name' => 'admin'
        ]);

        Role::firstOrCreate([
            'name' => 'student'
        ]);
    }

    /**
     * Mock DB with fake response of the postgres database
     * @param $roomAuth bool Room Authentication feature flag
     * @param $users Collection Collection of Users
     * @param $rooms Collection Collection of Rooms
     * @param $sharedAccesses Collection Collection of SharedAccesses
     */
    private function fakeDatabase($roomAuth, $users, $rooms, $sharedAccesses)
    {
        // preserve DB default
        $connection     = DB::connection();

        DB::shouldReceive('connection')
            ->with(null)
            ->andReturn($connection);

        // mock connection to greenlight postgres database and queries
        DB::shouldReceive('connection')
            ->with('greenlight')
            ->andReturn(Mockery::mock('Illuminate\Database\Connection', function ($mock) use ($sharedAccesses, $rooms, $users, $roomAuth) {
                $mock->shouldReceive('table')
                    ->with('features')
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
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                        $mock->shouldReceive('where')
                            ->with('deleted', false)
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($users) {
                                $mock->shouldReceive('get')
                                    ->with(['id','provider','username','email','name','password_digest'])
                                    ->andReturn($users);
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('rooms')
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($rooms) {
                        $mock->shouldReceive('where')
                            ->with('deleted', false)
                            ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($rooms) {
                                $mock->shouldReceive('get')
                                    ->with(['id','uid','user_id','name','room_settings','access_code'])
                                    ->andReturn($rooms);
                            }));
                    }));

                $mock->shouldReceive('table')
                    ->with('shared_accesses')
                    ->andReturn(Mockery::mock('Illuminate\Database\Query\Builder', function ($mock) use ($sharedAccesses) {
                        $mock->shouldReceive('get')
                            ->with(['room_id','user_id'])
                            ->andReturn($sharedAccesses);
                    }));
            }));
    }

    protected function testCommand($roomAuth, ?string $prefix = null)
    {
        // password for all users
        $password = Hash::make('secret');

        // create user that exists before import
        $existingUser            = new User();
        $existingUser->firstname = 'John';
        $existingUser->lastname  = 'Doe';
        $existingUser->email     = 'john.doe@domain.tld';
        $existingUser->password  = $password;
        $existingUser->save();

        // create external user that exists before import
        $existingLdapUser                = new User();
        $existingLdapUser->authenticator = 'external';
        $existingLdapUser->external_id   = 'djohn';
        $existingLdapUser->firstname     = 'John';
        $existingLdapUser->lastname      = 'Doe';
        $existingLdapUser->email         = 'john.doe@domain.tld';
        $existingLdapUser->password      = $password;
        $existingLdapUser->save();

        // create room that exists before import
        $existingRoom       = new Room();
        $existingRoom->name = 'Existing room 1';
        $existingRoom->roomType()->associate(RoomType::all()->first());
        $existingRoom->owner()->associate($existingUser);
        $existingRoom->save();

        // Create fake users and ldap users
        $users   = [];
        $users[] = new GreenlightUser(1, 'greenlight', 'John Doe', null, 'john.doe@domain.tld', $password);
        $users[] = new GreenlightUser(2, 'greenlight', 'John Doe', null, 'john@domain.tld', $password);
        $users[] = new GreenlightUser(3, 'ldap', 'John Doe', 'djohn', 'john.doe@domain.tld', null);
        $users[] = new GreenlightUser(4, 'ldap', 'John Doe', 'doejohn', 'john@domain.tld', null);

        // Create fake rooms
        $rooms          = [];
        $rooms[]        = new GreenlightRoom(1, $users[0]->id, 'Test Room 1', 'abc-def-xyz-123');
        $rooms[]        = new GreenlightRoom(2, $users[1]->id, 'Test Room 2', 'abc-def-xyz-234');
        $rooms[]        = new GreenlightRoom(3, $users[2]->id, 'Test Room 3', 'abc-def-xyz-345');
        $rooms[]        = new GreenlightRoom(4, $users[3]->id, 'Test Room 4', 'abc-def-xyz-456');

        $rooms[]        = new GreenlightRoom(5, $users[0]->id, 'Test Room 7', 'hij-klm-xyz-123', 123456, ['muteOnStart' => false,'requireModeratorApproval' => true,'anyoneCanStart' => false,'joinModerator' => true]);
        $rooms[]        = new GreenlightRoom(6, $users[0]->id, 'Test Room 8', 'hij-klm-xyz-234', null, ['muteOnStart' => true,'requireModeratorApproval' => false,'anyoneCanStart' => true,'joinModerator' => false]);
        $rooms[]        = new GreenlightRoom(7, 99, 'Test Room 9', 'hij-klm-xyz-456', 123456);
        $rooms[]        = new GreenlightRoom(8, $users[0]->id, 'Test Room 10', $existingRoom->id);

        // Create fake shared accesses
        $sharedAccesses    = [];
        $sharedAccesses[]  = new GreenlightSharedAccess(1, 1, 2);
        $sharedAccesses[]  = new GreenlightSharedAccess(2, 1, 3);  // shared access should be applied for existing users
        $sharedAccesses[]  = new GreenlightSharedAccess(2, 1, 4);
        $sharedAccesses[]  = new GreenlightSharedAccess(3, 1, 99); // invalid user id
        $sharedAccesses[]  = new GreenlightSharedAccess(6, 7, 1);  // room that has an invalid owner
        $sharedAccesses[]  = new GreenlightSharedAccess(7, 8, 1);  // room that already exists should not be modified

        // mock database connections with fake data
        $this->fakeDatabase($roomAuth, new Collection($users), new Collection($rooms), new Collection($sharedAccesses));

        // run artisan command and text questions and outputs
        $this->artisan('import:greenlight-v2 localhost 5432 greenlight_production postgres 12345678')
            ->expectsQuestion('What room type should the rooms be assigned to?', 'LE')
            ->expectsQuestion('Prefix for room names:', $prefix)
            ->expectsQuestion('Please select the default role for new imported non-ldap users', 'student')
            ->expectsOutput('Importing users')
            ->expectsOutput('2 created, 2 skipped (already existed)')
            ->expectsOutput('Importing rooms')
            ->expectsOutput('6 created, 1 skipped (already existed)')
            ->expectsOutput('Room import failed for the following 1 rooms, because no room owner was found:')
            ->expectsOutput('+-------------+-----------------+-------------+')
            ->expectsOutput('| Name        | ID              | Access code |')
            ->expectsOutput('+-------------+-----------------+-------------+')
            ->expectsOutput('| Test Room 9 | hij-klm-xyz-456 | 123456      |') // user was not found in greenlight DB
            ->expectsOutput('+-------------+-----------------+-------------+')
            ->expectsOutput('Importing shared room accesses')
            ->expectsOutput('3 created, 3 skipped (user or room not found)');

        // check amount of rooms and users
        $this->assertCount(7, Room::all());
        $this->assertCount(2, User::where('authenticator', 'local')->get());
        $this->assertCount(2, User::where('authenticator', 'external')->get());

        // check if all rooms are created
        $this->assertEqualsCanonicalizing(
            [$existingRoom->id,'abc-def-xyz-123','abc-def-xyz-234','abc-def-xyz-345','abc-def-xyz-456','hij-klm-xyz-123','hij-klm-xyz-234'],
            Room::all()->pluck('id')->toArray()
        );

        // check if allow guest setting is correct
        foreach (Room::where('id', '!=', $existingRoom->id)->get() as $room) {
            $this->assertEquals(!$roomAuth, $room->allow_guests);
        }

        // check access code
        $this->assertNull(Room::find('abc-def-xyz-123')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-234')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-345')->access_code);
        $this->assertNull(Room::find('abc-def-xyz-456')->access_code);
        $this->assertEquals(123456, Room::find('hij-klm-xyz-123')->access_code);
        $this->assertNull(Room::find('hij-klm-xyz-234')->access_code);

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
        if ($prefix != null) {
            $this->assertEquals($prefix.' Test Room 1', Room::find('abc-def-xyz-123')->name);
        } else {
            $this->assertEquals('Test Room 1', Room::find('abc-def-xyz-123')->name);
        }

        // Testing room ownership
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'local')->first(), Room::find('abc-def-xyz-123')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'local')->first(), Room::find('abc-def-xyz-234')->owner);
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'external')->first(), Room::find('abc-def-xyz-345')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'external')->first(), Room::find('abc-def-xyz-456')->owner);

        // Testing users
        $this->assertNotNull(User::where([['authenticator', 'external'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john.doe@domain.tld'],['external_id', 'djohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'external'],['firstname', 'John Doe'],['lastname', ''],['email', 'john@domain.tld'],['external_id', 'doejohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'local'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john.doe@domain.tld'],['external_id', null],['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'local'],['firstname', 'John Doe'],['lastname', ''],['email', 'john@domain.tld'],['external_id', null],['password', $password]])->first());
    
        // Testing user roles for new non ldap-users
        $this->assertEquals(['student'], User::where([['authenticator', 'local'],['firstname', 'John Doe'],['lastname', ''],['email', 'john@domain.tld'],['external_id', null],['password', $password]])->first()->roles->pluck('name')->toArray());

        // Testing ldap and existing users dont get a default role assigned
        $this->assertCount(0, User::where([['authenticator', 'external'],['firstname', 'John Doe'],['lastname', ''],['email', 'john@domain.tld'],['external_id', 'doejohn']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'external'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john.doe@domain.tld'],['external_id', 'djohn']])->first()->roles);
        $this->assertCount(0, User::where([['authenticator', 'local'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john.doe@domain.tld'],['external_id', null],['password', $password]])->first()->roles);

        // Testing room memberships (should be moderator, as that is the greenlight equivalent)
        $this->assertCount(3, Room::find('abc-def-xyz-123')->members);
        foreach (Room::find('abc-def-xyz-123')->members as $member) {
            $this->assertEquals(RoomUserRole::MODERATOR, $member->pivot->role);
        }
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'local')->first()));
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'external')->first()));
        $this->assertTrue(Room::find('abc-def-xyz-123')->members->contains(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'external')->first()));
    }

    public function test()
    {
        $this->testCommand(false);
    }

    public function testWithPrefix()
    {
        $this->testCommand(false, 'Migration:');
    }

    public function testWithRoomAuth()
    {
        $this->testCommand(true);
    }
}
