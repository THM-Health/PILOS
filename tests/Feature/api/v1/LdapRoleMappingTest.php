<?php

namespace Tests\Feature\api\v1;

use App\Role;
use App\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use LdapRecord\Laravel\Testing\DirectoryEmulator;
use LdapRecord\Models\Model;
use LdapRecord\Models\ModelDoesNotExistException;
use Tests\TestCase;
use LdapRecord\Models\OpenLDAP\User as LdapUser;

class LdapRoleMappingTest extends TestCase
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

        $fake = DirectoryEmulator::setup('default');

        $this->ldapUser = LdapUser::create([
            'givenName'              => $this->faker->firstName,
            'sn'                     => $this->faker->lastName,
            'cn'                     => $this->faker->name,
            'mail'                   => $this->faker->unique()->safeEmail,
            'uid'                    => $this->faker->unique()->userName,
            $this->ldapRoleAttribute => $this->ldapRoleName,
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

    /**
     * Test that the role gets only once assigned to the same user.
     *
     * @return void
     */
    public function testMappingOnSecondLogin()
    {
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

        $this->postJson(route('api.v1.logout'));

        $this->assertFalse($this->isAuthenticated($this->guard));

        $this->from(config('app.url'))->postJson(route('api.v1.ldapLogin'), [
            'username' => $this->ldapUser->uid[0],
            'password' => 'secret'
        ]);

        $this->assertAuthenticated($this->guard);
        $this->assertDatabaseCount('role_user', 1);
    }
}
