<?php

namespace Tests\Unit\Console;

use App\Role;
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

    private function fakeDatabase($roomAuth, $users, $rooms, $sharedAccesses)
    {
        $connection     = DB::connection();
        $ldapConnection = DB::connection('ldap_default');

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

        DB::shouldReceive('connection')
            ->with('ldap_default')
            ->andReturn($ldapConnection);

        DB::shouldReceive('connection')
            ->with(null)
            ->andReturn($connection);
    }

    public function testMissing()
    {
        $roomAuth       = true;

        $password = Hash::make('secret');

        $existingUser            = new User();
        $existingUser->firstname = 'John';
        $existingUser->lastname  = 'Doe';
        $existingUser->email     = 'john.doe@domain.tld';
        $existingUser->password  = $password;
        $existingUser->save();

        $existingLdapUser                = new User();
        $existingLdapUser->authenticator = 'ldap';
        $existingLdapUser->username      = 'djohn';
        $existingLdapUser->firstname     = 'John';
        $existingLdapUser->lastname      = 'Doe';
        $existingLdapUser->email         = 'john.doe@domain.tld';
        $existingLdapUser->password      = $password;
        $existingLdapUser->save();

        $users   = [];
        $users[] = new GreenlightUser(1, 'greenlight', 'John Doe', null, 'john.doe@domain.tld', $password);
        $users[] = new GreenlightUser(2, 'greenlight', 'John Doe', null, 'john@domain.tld', $password);
        $users[] = new GreenlightUser(3, 'greenlight', 'John Doe', null, 'doe.john@domain.tld', $password);
        $users[] = new GreenlightUser(4, 'ldap', 'John Doe', 'johnd', 'john.doe@domain.tld', null);
        $users[] = new GreenlightUser(5, 'ldap', 'John Doe', 'doejohn', 'john@domain.tld', null);
        $users[] = new GreenlightUser(6, 'ldap', 'John Doe', 'djohn', 'doe.john@domain.tld', null);

        $rooms          = new Collection();
        $sharedAccesses = new Collection();

        $this->fakeDatabase($roomAuth, new Collection($users), $rooms, $sharedAccesses);

        $this->artisan('import:greenlight localhost 5432 greenlight_production postgres 12345678')
            ->expectsQuestion('What room type should the rooms be assigned to?', 'VL')
            ->expectsQuestion('Prefix for room names:', 'Demo')
            ->expectsOutput('3 created, 2 skipped (already existed)')
            ->expectsOutput('LDAP import failed for the following 1 users:')
            ->expectsOutput('+----------+----------+')
            ->expectsOutput('| Name     | Username |')
            ->expectsOutput('+----------+----------+')
            ->expectsOutput('| John Doe | johnd    |')
            ->expectsOutput('+----------+----------+');
    }
}
