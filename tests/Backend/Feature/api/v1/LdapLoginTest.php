<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Role;
use Config;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\OpenLDAP\User as LdapUser;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class LdapLoginTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @var string The guard that is used for the ldap authenticated users.
     */
    private $guard = 'ldap';

    private LdapUser $ldapUser;

    /**
     * @var string Name of the ldap role.
     */
    private $ldapRoleName = 'admin';

    /**
     * @var string[] Mapping from ldap roles to test roles.
     */
    private $roleMap = [
        'admin' => 'test',
    ];

    private $ldapMapping = '
    {
        "attributes": {
          "external_id": "uid",
          "first_name": "givenname",
          "last_name": "sn",
          "email": "mail",
          "roles": "userclass",
          "ou": "ou"
        },
        "roles": [
          {
            "name": "user",
            "disabled": false,
            "rules": [
              {
                "attribute": "external_id",
                "regex": "/^.*/im"
              }
            ]
          },
          {
            "name": "guest",
            "disabled": false,
            "rules": [
              {
                "attribute": "email",
                "not": true,
                "regex": "/@university.org$/im"
              }
            ]
          },
          {
            "name": "admin",
            "disabled": false,
            "all": true,
            "rules": [
              {
                "attribute": "roles",
                "regex": "/^(administrator)$/im"
              }
            ]
          }
        ]
      }
      ';

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('ldap.enabled', true);
        Config::set('ldap.mapping', json_decode($this->ldapMapping));

        $fake = DirectoryEmulator::setup('default');

        $this->ldapUser = LdapUser::create([
            'givenName' => $this->faker->firstName,
            'sn' => $this->faker->lastName,
            'cn' => $this->faker->name,
            'mail' => $this->faker->unique()->userName().'@university.org',
            'uid' => $this->faker->unique()->userName,
            'userclass' => ['administrator'],
            'entryuuid' => $this->faker->uuid,
        ]);

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'guest']);
        Role::firstOrCreate(['name' => 'user']);

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
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
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
        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
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
        $response = $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => 'testuser',
            'password' => 'secret',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    /**
     * Test attributes get mapped correctly.
     */
    public function testAttributeMapping()
    {
        Log::swap(new LogFake);
        Config::set('ldap.logging.enabled', false);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();

        $this->assertEquals($this->ldapUser->uid[0], $user->external_id);
        $this->assertEquals($this->ldapUser->givenName[0], $user->firstname);
        $this->assertEquals($this->ldapUser->sn[0], $user->lastname);
        $this->assertEquals($this->ldapUser->mail[0], $user->email);

        // Check no log entry created
        Log::assertNotLogged(
            fn (LogEntry $log) => $log->level === 'debug'
                && $log->message == 'LDAP attributes'
                && $log->context['givenname'][0] == $this->ldapUser->givenName[0]
                && $log->context['sn'][0] == $this->ldapUser->sn[0]
                && $log->context['mail'][0] == $this->ldapUser->mail[0]
                && $log->context['uid'][0] == $this->ldapUser->uid[0]
                && $log->context['userclass'][0] == $this->ldapUser->userclass[0]
                && $log->context['entryuuid'][0] == $this->ldapUser->entryuuid[0]
        );
    }

    /**
     * Test attributes get mapped correctly.
     */
    public function testAttributeMappingLogging()
    {
        Log::swap(new LogFake);
        Config::set('ldap.logging.enabled', true);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();

        $this->assertEquals($this->ldapUser->uid[0], $user->external_id);
        $this->assertEquals($this->ldapUser->givenName[0], $user->firstname);
        $this->assertEquals($this->ldapUser->sn[0], $user->lastname);
        $this->assertEquals($this->ldapUser->mail[0], $user->email);

        // Check log entry created
        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'debug'
                && $log->message == 'LDAP attributes'
                && $log->context['givenname'][0] == $this->ldapUser->givenName[0]
                && $log->context['sn'][0] == $this->ldapUser->sn[0]
                && $log->context['mail'][0] == $this->ldapUser->mail[0]
                && $log->context['uid'][0] == $this->ldapUser->uid[0]
                && $log->context['userclass'][0] == $this->ldapUser->userclass[0]
                && $log->context['entryuuid'][0] == $this->ldapUser->entryuuid[0]
        );
    }

    /**
     * Test that the correct error message is returned when the attribute mapping is incomplete.
     */
    public function testIncompleteAttributeMapping()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        unset($newAttributeConf->attributes->first_name);
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ])
            ->assertJsonFragment(['message' => 'Attributes for authentication are missing.'])
            ->assertServerError();
    }

    /**
     * Test that the correct error message is returned when trying to map a non existing ldap attribute.
     */
    public function testNonExistingLdapAttributeMapping()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        $newAttributeConf->attributes->first_name = 'wrongAttribute';
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ])
            ->assertJsonFragment(['message' => 'Attributes for authentication are missing.'])
            ->assertServerError();
    }

    /**
     * Test that mapping to a non existing model attribute is not failing.
     */
    public function testNonExistingModelAttributeMapping()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        $newAttributeConf->attributes->new_attribute = 'givenName';
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
    }

    /**
     * Test roles get mapped correctly.
     */
    public function testRoleMapping()
    {
        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');

        $roles = $user->roles()->orderBy('roles.name')->get();

        $this->assertCount(2, $roles);
        $this->assertEquals('admin', $roles[0]->name);
        $this->assertTrue($roles[0]->pivot->automatic);

        $this->assertEquals('user', $roles[1]->name);
        $this->assertTrue($roles[0]->pivot->automatic);
    }

    /**
     * Test roles get mapped correctly, ignoring the invalid attribute.
     */
    public function testRoleMappingInvalidLdapAttribute()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        $newAttributeConf->roles[0]->rules[0]->attribute = 'notExistingAttribute';
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');

        $roles = $user->roles;

        $this->assertCount(1, $roles);
        $this->assertEquals('admin', $roles[0]->name);
        $this->assertTrue($roles[0]->pivot->automatic);
    }

    /**
     * Test roles get mapped correctly, ignoring invalid roles
     */
    public function testRoleMappingInvalidRoles()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        $newAttributeConf->roles[0]->name = 'notExistingRole';
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');

        $roles = $user->roles;

        $this->assertCount(1, $roles);
        $this->assertEquals('admin', $roles[0]->name);
        $this->assertTrue($roles[0]->pivot->automatic);
    }

    /**
     * Test that no roles gets mapped if the role mapping is empty.
     */
    public function testEmptyRoleMap()
    {
        $newAttributeConf = json_decode($this->ldapMapping);
        $newAttributeConf->roles = [];
        Config::set('ldap.mapping', $newAttributeConf);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $user = $this->getAuthenticatedUser();
        $user->load('roles');
        $this->assertCount(0, $user->roles);
    }

    /**
     * Test that the role gets only once assigned to the same user.
     *
     * @return void
     */
    public function testMappingOnSecondLogin()
    {
        $this->ldapUser->replaceAttribute('userclass', ['administrator']);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
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

        $this->postJson(route('api.v1.logout'));

        $this->assertFalse($this->isAuthenticated($this->guard));

        $user->roles()->attach(Role::firstOrCreate(['name' => 'test'])->id);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);
        $this->assertDatabaseCount('role_user', 3);
        $user->load('roles');
        $roleNames = array_map(function ($role) {
            return $role->name;
        }, $user->roles->all());

        $this->assertCount(3, $roleNames);
        $this->assertContains('admin', $roleNames);
        $this->assertContains('user', $roleNames);
        $this->assertContains('test', $roleNames);

        $this->ldapUser->replaceAttribute('userclass', []);

        $this->postJson(route('api.v1.logout'));

        $this->assertFalse($this->isAuthenticated($this->guard));

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
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

    /**
     * Tests logging the found ldap roles for authenticated users.
     *
     * @return void
     */
    public function testRoleLogging()
    {
        Log::swap(new LogFake);

        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret',
        ]);

        $this->assertAuthenticated($this->guard);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'info'
                && $log->message == 'Roles found for user ({user}): {roles}.'
                && $log->context['user'] == $this->ldapUser->uid[0]
                && $log->context['roles'] == 'user, admin'
        );
    }

    /**
     * Tests logging of failed and successful logins.
     *
     * @return void
     */
    public function testLogging()
    {
        // test failed login
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => 'testuser',
            'password' => 'secret',
        ]);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'notice'
                && $log->message == 'External user testuser has failed authentication.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
                && $log->context['type'] == 'ldap'
        );

        // test successful login
        Log::swap(new LogFake);
        $this->from(config('app.url'))->postJson(route('api.v1.login.ldap'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'bar',
        ]);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'info'
                && $log->message == 'External user '.$this->ldapUser->uid[0].' has been successfully authenticated.'
                && $log->context['ip'] == '127.0.0.1'
                && $log->context['current-user'] == 'guest'
                && $log->context['type'] == 'ldap'
        );
    }
}
