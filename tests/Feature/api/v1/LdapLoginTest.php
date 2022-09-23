<?php

namespace Tests\Feature\api\v1;

use App\Models\Role;
use App\Models\User;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\Model;
use LdapRecord\Models\ModelDoesNotExistException;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Tests\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class LdapLoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @var string $guard The guard that is used for the ldap authenticated users.
     */
    private $guard = 'ldap';

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
        Config::set('ldap.enabled', true);

        $fake = DirectoryEmulator::setup('default');

        $this->ldapUser = LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            $this->ldapRoleAttribute => [$this->ldapRoleName],
            'entryuuid'              => $this->faker->uuid,
        ]);

        Role::firstOrCreate([
            'name' => $this->roleMap[$this->ldapRoleName]
        ]);

        $fake->actingAs($this->ldapUser);
    }

    /**
     * Returns the current authenticated user for the configured guard.
     *
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    private function getAuthenticatedUser()
    {
        return Auth::guard($this->guard)->user();
    }

    /**
     * Test that the ldap login route is disabled if disabled in env
     *
     * @return void
     */
    public function testLoginRoute()
    {
        Config::set('ldap.enabled', false);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $response->assertNotFound();
    }

    /**
     * Test that user can login with valid credentials
     *
     * @return void
     */
    public function testLoginSuccess()
    {
        $this->assertGuest($this->guard);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
    }

    /**
     * Tests that a correct response gets returned when trying to login with invalid credentials.
     *
     * @return void
     */
    public function testLoginWrongCredentials()
    {
        $this->assertGuest($this->guard);
        $response = $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => 'testuser',
            'password' => 'secret'
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    /**
     * Test that guid of user is updated if changed in ldap
     *
     * @return void
     */
    public function testLoginGuidChange()
    {
        self::assertCount(0, User::all());
        // Create new LDAP user with given uuid
        $originalUUID = $this->faker->uuid;
        $ldapUser     = LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            $this->ldapRoleAttribute => [$this->ldapRoleName],
            'entryuuid'              => $originalUUID,
        ]);
        DirectoryEmulator::setup()->actingAs($ldapUser);

        // Login with this new user
        $this->assertGuest($this->guard);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $ldapUser->uid[0],
            'password' => 'secret'
        ]);
        $this->assertAuthenticated($this->guard);

        // Check if new user with this uuid was created
        self::assertCount(1, User::all());
        $databaseUser = User::where('username', $ldapUser->uid[0])->where('authenticator', 'ldap')->first();
        $this->assertNotNull($databaseUser);
        $this->assertEquals($originalUUID, $databaseUser->guid);

        // Logout user
        $response = $this->from(config('app.url'))->postJson(route('api.v1.logout'));
        $response->assertNoContent();
        $this->assertGuest();

        // Remove and re-add user with the same data but different uuid
        $newUUID     = $this->faker->uuid;
        $newLdapUser = LdapUser::make([
            'givenName'              => $ldapUser->givenName,
            'sn'                     => $ldapUser->sn,
            'cn'                     => $ldapUser->cn,
            'mail'                   => $ldapUser->mail,
            'uid'                    => $ldapUser->uid,
            $this->ldapRoleAttribute => $ldapUser->{$this->ldapRoleAttribute},
            'entryuuid'              => $newUUID,
        ]);
        $ldapUser->delete();
        $newLdapUser->save();
        DirectoryEmulator::setup()->actingAs($newLdapUser);

        // Try to re-login
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $newLdapUser->uid[0],
            'password' => 'secret'
        ]);

        // Check if login was successful
        $this->assertAuthenticated($this->guard);
        // Check if no new user was created and existing user was updated
        self::assertCount(1, User::all());
        $databaseUser->refresh();
        $this->assertEquals($newUUID, $databaseUser->guid);
    }

    /**
     * Test that no roles gets mapped if the roleMap config is empty.
     *
     * @return void
     */
    public function testEmptyRoleMap()
    {
        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => []
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $this->assertCount(0, $user->roles);
    }

    /**
     * Test that a role gets not assigned if the role attribute is empty on the ldap user model.
     *
     * @throws ModelDoesNotExistException
     * @return void
     */
    public function testEmptyLdapRoleAttribute()
    {
        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, null);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => $this->roleMap
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $this->assertCount(0, $user->roles);
    }

    /**
     * Test that a role gets not assigned if the role attribute doesn't exists on the ldap user model.
     *
     * @throws ModelDoesNotExistException
     * @return void
     */
    public function testNotExistingLdapRoleAttribute()
    {
        $this->ldapUser->deleteAttribute([ $this->ldapRoleAttribute ]);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => $this->roleMap
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $this->assertCount(0, $user->roles);
    }

    /**
     * Test that nothing happens if a ldap role is mapped to an not existing role.
     *
     * @return void
     */
    public function testNotExistingMappedRole()
    {
        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => [
                $this->ldapRoleName => 'bar'
            ]
        ]);

        $response = $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $this->assertCount(0, $user->roles);
    }

    /**
     * Test that the role gets successfully assigned to an authenticated user.
     *
     * @return void
     */
    public function testExistingMappedRole()
    {
        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => $this->roleMap
        ]);
        setting(['default_timezone' => 'Europe/London']);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());
        $this->assertEquals('Europe/London', $user->timezone);
        $this->assertCount(1, $roleNames);
        $this->assertContains($this->roleMap[$this->ldapRoleName], $roleNames);
    }

    /**
     * Test that the role gets only once assigned to the same user.
     *
     * @return void
     */
    public function testMappingOnSecondLogin()
    {
        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, ['ldapAdmin', 'ldapSuperAdmin']);

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => [
                'ldapAdmin'      => 'admin',
                'ldapUser'       => 'user',
                'ldapSuperAdmin' => 'admin'
            ]
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());

        $this->assertCount(1, $roleNames);
        $this->assertContains('admin', $roleNames);

        $this->postJson(route('api.v1.logout'));

        $this->assertFalse($this->isAuthenticated($this->guard));

        $user->roles()->attach(Role::firstOrCreate(['name' => 'test'])->id);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $this->assertDatabaseCount('role_user', 2);
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());

        $this->assertCount(2, $roleNames);
        $this->assertContains('admin', $roleNames);
        $this->assertContains('test', $roleNames);

        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, ['ldapUser']);

        $this->postJson(route('api.v1.logout'));

        $this->assertFalse($this->isAuthenticated($this->guard));

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $this->assertDatabaseCount('role_user', 2);
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());

        $this->assertCount(2, $roleNames);
        $this->assertContains('user', $roleNames);
        $this->assertContains('test', $roleNames);
    }

    public function testMultipleRolesPartiallyMapped()
    {
        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, [
            $this->ldapRoleName,
            'foo'
        ]);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => $this->roleMap
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());
        $this->assertCount(1, $roleNames);
        $this->assertContains($this->roleMap[$this->ldapRoleName], $roleNames);
    }

    public function testMultipleRolesFullMapped()
    {
        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, ['ldapAdmin', 'ldapUser', 'ldapSuperAdmin']);

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => [
                'ldapAdmin'      => 'admin',
                'ldapUser'       => 'user',
                'ldapSuperAdmin' => 'admin'
            ]
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());
        $this->assertCount(2, $roleNames);
        $this->assertContains('admin', $roleNames);
        $this->assertContains('user', $roleNames);
    }

    /**
     * Tests logging the found ldap roles for authenticated users.
     *
     * @return void
     */
    public function testRoleLogging()
    {
        Log::swap(new LogFake);
        $this->ldapUser->updateAttribute($this->ldapRoleAttribute, ['ldapAdmin', 'ldapUser', 'ldapSuperAdmin']);

        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => [
                'ldapAdmin'      => 'admin',
                'ldapUser'       => 'user',
                'ldapSuperAdmin' => 'admin'
            ],
            'auth.log.ldap_roles' => true
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level === 'debug'
            && $log->message == 'LDAP roles found for user ['.$this->ldapUser->uid[0].'].'
            && count($log->context) == 3
            && $log->context[0] == 'ldapAdmin'
            && $log->context[1] == 'ldapUser'
            && $log->context[2] == 'ldapSuperAdmin'
        );

        Auth::guard('ldap')->logout();
        Log::swap(new LogFake);
        config([
            'ldap.ldapRoleAttribute' => $this->ldapRoleAttribute,
            'ldap.roleMap'           => [
                'ldapAdmin'      => 'admin',
                'ldapUser'       => 'user',
                'ldapSuperAdmin' => 'admin'
            ],
            'auth.log.ldap_roles' => false
        ]);

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);

        Log::assertNotLogged(
            fn (LogEntry $log) =>
                $log->level === 'debug'
                && $log->message == 'LDAP roles found for user ['.$this->ldapUser->uid[0].'].'
                    && count($log->context) == 3
                    && $log->context[0] == 'ldapAdmin'
                    && $log->context[1] == 'ldapUser'
                    && $log->context[2] == 'ldapSuperAdmin'
        );
    }

    /**
     * Tests logging of failed and successful logins.
     *
     * @return void
     */
    public function testLogging()
    {
        // test failed login with logging enabled
        Log::swap(new LogFake);
        config(['auth.log.failed' => true]);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username'    => 'testuser',
            'password'    => 'secret'
        ]);
        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User [testuser] has failed authentication.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'ldap'
        );

        // test failed login with logging disabled
        config(['auth.log.failed' => false]);
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username'    => 'testuser',
            'password'    => 'foo'
        ]);
        Log::assertNotLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User [testuser] has failed authentication.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'ldap'
        );

        // test successful login with logging enabled
        Log::swap(new LogFake);
        config(['auth.log.successful' => true]);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username'    => $this->ldapUser->uid[0],
            'password'    => 'bar'
        ]);
        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level == 'info'
            && $log->message == 'User ['.$this->ldapUser->uid[0].'] has been successfully authenticated.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'ldap'
        );

        // logout user to allow new login
        Auth::guard('ldap')->logout();

        // test successful login with logging disabled
        Log::swap(new LogFake);
        config(['auth.log.successful' => false]);
        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username'    => $this->ldapUser->uid[0],
            'password'    => 'bar'
        ]);
        Log::assertNotLogged(
            fn (LogEntry $log) =>
            $log->level === 'info'
            && $log->message == 'User ['.$this->ldapUser->uid[0].'] has been successfully authenticated.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['user-agent'] == 'Symfony'
                && $log->context['authenticator'] == 'ldap'
        );
    }
}
