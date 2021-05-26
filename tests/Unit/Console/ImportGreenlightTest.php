<?php

namespace Tests\Unit\Console;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Role;
use App\Room;
use App\RoomType;
use App\User;
use DB;
use Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Collection;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\Model;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Mockery;
use Tests\TestCase;
use Tests\Unit\Console\helper\GreenlightRoom;
use Tests\Unit\Console\helper\GreenlightSharedAccess;
use Tests\Unit\Console\helper\GreenlightUser;

class ImportGreenlightTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @var Model|null $ldapUser The ldap user that is used in the tests.
     */
    private $ldapUser = null;

    /**
     * @var string $ldapRoleName Name of the ldap role.
     */
    private $ldapRoleName = 'admin';

    /**
     * @var string[] $roleMap Mapping from ldap roles to test roles.
     */
    private $roleMap = [
        'admin' => 'test'
    ];

    /**
     * @var string Attribute of ldap user that contains the ldap role.
     */
    private $ldapRoleAttribute = 'userclass';

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();

        DirectoryEmulator::setup('default');

        $this->ldapUser = LdapUser::create([
            'givenName'              => 'John',
            'sn'                     => 'Doe',
            'cn'                     => 'John Doe',
            'mail'                   => 'john@domain.tld',
            'uid'                    => 'doejohn',
            $this->ldapRoleAttribute => [$this->ldapRoleName],
            'entryuuid'              => $this->faker->uuid,
        ]);

        Role::firstOrCreate([
            'name' => $this->roleMap[$this->ldapRoleName]
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
        // preserve DB default and ldap connection
        $connection     = DB::connection();
        $ldapConnection = DB::connection('ldap_default');
        DB::shouldReceive('connection')
            ->with('ldap_default')
            ->andReturn($ldapConnection);

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

    protected function testCommand($roomAuth, $prefix)
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

        // create ldap user that exists before import
        $existingLdapUser                = new User();
        $existingLdapUser->authenticator = 'ldap';
        $existingLdapUser->username      = 'djohn';
        $existingLdapUser->firstname     = 'John';
        $existingLdapUser->lastname      = 'Doe';
        $existingLdapUser->email         = 'doe.john@domain.tld';
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
        $users[] = new GreenlightUser(3, 'greenlight', 'John Doe', null, 'doe.john@domain.tld', $password);
        $users[] = new GreenlightUser(4, 'ldap', 'John Doe', 'johnd', 'john.doe@domain.tld', null);
        $users[] = new GreenlightUser(5, 'ldap', 'John Doe', 'doejohn', 'john@domain.tld', null);
        $users[] = new GreenlightUser(6, 'ldap', 'John Doe', 'djohn', 'doe.john@domain.tld', null);

        // Create fake rooms
        $rooms          = [];
        $rooms[]        = new GreenlightRoom(1, $users[0]->id, 'Test Room 1', 'abc-def-123');
        $rooms[]        = new GreenlightRoom(2, $users[1]->id, 'Test Room 2', 'abc-def-234');
        $rooms[]        = new GreenlightRoom(3, $users[2]->id, 'Test Room 3', 'abc-def-345');
        $rooms[]        = new GreenlightRoom(4, $users[3]->id, 'Test Room 4', 'abc-def-456');
        $rooms[]        = new GreenlightRoom(5, $users[4]->id, 'Test Room 5', 'abc-def-567');
        $rooms[]        = new GreenlightRoom(6, $users[5]->id, 'Test Room 6', 'abc-def-678');

        $rooms[]        = new GreenlightRoom(7, $users[0]->id, 'Test Room 7', 'hij-klm-123', 123456, ['muteOnStart' => false,'requireModeratorApproval' => true,'anyoneCanStart' => false,'joinModerator' => true]);
        $rooms[]        = new GreenlightRoom(8, $users[0]->id, 'Test Room 8', 'hij-klm-234', null, ['muteOnStart' => true,'requireModeratorApproval' => false,'anyoneCanStart' => true,'joinModerator' => false]);
        $rooms[]        = new GreenlightRoom(9, 99, 'Test Room 9', 'hij-klm-456', 123456);
        $rooms[]        = new GreenlightRoom(10, $users[0]->id, 'Test Room 10', $existingRoom->id);

        // Create fake shared accesses
        $sharedAccesses    = [];
        $sharedAccesses[]  = new GreenlightSharedAccess(1, 1, 2);
        $sharedAccesses[]  = new GreenlightSharedAccess(2, 1, 3);
        $sharedAccesses[]  = new GreenlightSharedAccess(3, 1, 4);
        $sharedAccesses[]  = new GreenlightSharedAccess(4, 1, 5);
        $sharedAccesses[]  = new GreenlightSharedAccess(5, 1, 6);
        $sharedAccesses[]  = new GreenlightSharedAccess(6, 4, 1);
        $sharedAccesses[]  = new GreenlightSharedAccess(7, 9, 1);

        // mock database connections with fake data
        $this->fakeDatabase($roomAuth, new Collection($users), new Collection($rooms), new Collection($sharedAccesses));

        // run artisan command and text questions and outputs
        $this->artisan('import:greenlight localhost 5432 greenlight_production postgres 12345678')
            ->expectsQuestion('What room type should the rooms be assigned to?', 'VL')
            ->expectsQuestion('Prefix for room names:', $prefix)
            ->expectsOutput('Importing users')
            ->expectsOutput('3 created, 2 skipped (already existed)')
            ->expectsOutput('LDAP import failed for the following 1 users:')
            ->expectsOutput('+----------+----------+')
            ->expectsOutput('| Name     | Username |')
            ->expectsOutput('+----------+----------+')
            ->expectsOutput('| John Doe | johnd    |') // user does not exist in fake ldap directory
            ->expectsOutput('+----------+----------+')
            ->expectsOutput('Importing rooms')
            ->expectsOutput('7 created, 1 skipped (already existed)')
            ->expectsOutput('Room import failed for the following 2 rooms, because no room owner was found:')
            ->expectsOutput('+-------------+-------------+-------------+')
            ->expectsOutput('| Name        | ID          | Access code |')
            ->expectsOutput('+-------------+-------------+-------------+')
            ->expectsOutput('| Test Room 4 | abc-def-456 |             |') // room owner the the user that as missing in the ldap
            ->expectsOutput('| Test Room 9 | hij-klm-456 | 123456      |') // user was not found in greenlight DB
            ->expectsOutput('+-------------+-------------+-------------+')
            ->expectsOutput('Importing shared room accesses')
            ->expectsOutput('4 created, 3 skipped (user or room not found)');

        // check amount of rooms and users
        $this->assertCount(8, Room::all());
        $this->assertCount(3, User::where('authenticator', 'users')->get());
        $this->assertCount(2, User::where('authenticator', 'ldap')->get());

        // check if all rooms are created
        $this->assertEquals(
            [$existingRoom->id,'abc-def-123','abc-def-234','abc-def-345','abc-def-567','abc-def-678' ,'hij-klm-123','hij-klm-234'],
            Room::all()->pluck('id')->toArray()
        );

        // check if allow guest setting is correct
        foreach (Room::where('id', '!=', $existingRoom->id)->get() as $room) {
            $this->assertEquals(!$roomAuth, $room->allowGuests);
        }

        // check access code
        $this->assertNull(Room::find('abc-def-123')->accessCode);
        $this->assertNull(Room::find('abc-def-234')->accessCode);
        $this->assertNull(Room::find('abc-def-345')->accessCode);
        $this->assertNull(Room::find('abc-def-567')->accessCode);
        $this->assertNull(Room::find('abc-def-678')->accessCode);
        $this->assertEquals(123456, Room::find('hij-klm-123')->accessCode);
        $this->assertNull(Room::find('hij-klm-234')->accessCode);

        // check room settings
        $this->assertFalse(Room::find('hij-klm-123')->muteOnStart);
        $this->assertFalse(Room::find('hij-klm-123')->everyoneCanStart);
        $this->assertEquals(RoomLobby::ENABLED, Room::find('hij-klm-123')->lobby);
        $this->assertEquals(RoomUserRole::MODERATOR, Room::find('hij-klm-123')->defaultRole);

        $this->assertTrue(Room::find('hij-klm-234')->muteOnStart);
        $this->assertTrue(Room::find('hij-klm-234')->everyoneCanStart);
        $this->assertEquals(RoomLobby::DISABLED, Room::find('hij-klm-234')->lobby);
        $this->assertEquals(RoomUserRole::USER, Room::find('hij-klm-234')->defaultRole);

        // TODO Check room name prefix

        // Testing room ownership
        $this->assertEquals(User::where('email', 'john.doe@domain.tld')->where('authenticator', 'users')->first(), Room::find('abc-def-123')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'users')->first(), Room::find('abc-def-234')->owner);
        $this->assertEquals(User::where('email', 'doe.john@domain.tld')->where('authenticator', 'users')->first(), Room::find('abc-def-345')->owner);
        $this->assertEquals(User::where('email', 'john@domain.tld')->where('authenticator', 'ldap')->first(), Room::find('abc-def-567')->owner);
        $this->assertEquals(User::where('email', 'doe.john@domain.tld')->where('authenticator', 'ldap')->first(), Room::find('abc-def-678')->owner);

        // Testing users
        $this->assertNotNull(User::where([['authenticator', 'ldap'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john@domain.tld'],['username', 'doejohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'ldap'],['firstname', 'John'],['lastname', 'Doe'],['email', 'doe.john@domain.tld'],['username', 'djohn']])->first());
        $this->assertNotNull(User::where([['authenticator', 'users'],['firstname', 'John'],['lastname', 'Doe'],['email', 'john.doe@domain.tld'],['username', null],['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'users'],['firstname', 'John Doe'],['lastname', ''],['email', 'john@domain.tld'],['username', null],['password', $password]])->first());
        $this->assertNotNull(User::where([['authenticator', 'users'],['firstname', 'John Doe'],['lastname', ''],['email', 'doe.john@domain.tld'],['username', null],['password', $password]])->first());

        // Testing room memberships (should be moderator, as that is the greenlight equivalent)
        $this->assertCount(4, Room::find('abc-def-123')->members);
        foreach (Room::find('abc-def-123')->members as $member) {
            $this->assertEquals(RoomUserRole::MODERATOR, $member->pivot->role);
        }
        $this->assertTrue(Room::find('abc-def-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'users')->first()));
        $this->assertTrue(Room::find('abc-def-123')->members->contains(User::where('email', 'doe.john@domain.tld')->where('authenticator', 'users')->first()));
        $this->assertTrue(Room::find('abc-def-123')->members->contains(User::where('email', 'john@domain.tld')->where('authenticator', 'ldap')->first()));
        $this->assertTrue(Room::find('abc-def-123')->members->contains(User::where('email', 'doe.john@domain.tld')->where('authenticator', 'ldap')->first()));
    }

    public function test()
    {
        $this->testCommand(false, null);
    }

    public function testWithPrefix()
    {
        $this->testCommand(false, 'Migration:');
    }

    public function testWithRoomAuth()
    {
        $this->testCommand(true, null);
    }
}
