<?php

namespace Tests\Unit;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private $users = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->users[] = factory(User::class)->create([
            'firstname' => 'Max',
            'lastname'  => 'Mustermann'
        ]);

        $this->users[] = factory(User::class)->create([
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $this->users[] = factory(User::class)->create([
            'firstname' => 'Erika',
            'lastname'  => 'Mustermann'
        ]);
    }

    public function testReturnsUserWithGivenFirstnamePart()
    {
        $result = User::withFirstname('hn')->get();
        $this->assertCount(1, $result);
        $this->assertEquals($this->users[1]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[1]->lastname, $result[0]->lastname);
    }

    public function testReturnsUserWithGivenLastnamePart()
    {
        $result = User::withLastname('us')->get();
        $this->assertCount(2, $result);
        $this->assertEquals($this->users[0]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[0]->lastname, $result[0]->lastname);
        $this->assertEquals($this->users[2]->firstname, $result[1]->firstname);
        $this->assertEquals($this->users[2]->lastname, $result[1]->lastname);

        $result = User::withLastname('Mustermann')->get();
        $this->assertCount(2, $result);
        $this->assertEquals($this->users[0]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[0]->lastname, $result[0]->lastname);
        $this->assertEquals($this->users[2]->firstname, $result[1]->firstname);
        $this->assertEquals($this->users[2]->lastname, $result[1]->lastname);
    }

    public function testReturnsUserWithGivenNamePart()
    {
        $result = User::withName('ust ax')->get();
        $this->assertCount(1, $result);
        $this->assertEquals($this->users[0]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[0]->lastname, $result[0]->lastname);

        $result = User::withName('ax    ust')->get();
        $this->assertCount(1, $result);
        $this->assertEquals($this->users[0]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[0]->lastname, $result[0]->lastname);

        $result = User::withName('ax    ust')->where('id', $this->users[1]->id)->get();
        $this->assertCount(0, $result);

        $result = User::withName('Max Doe')->where('id', $this->users[1]->id)->get();
        $this->assertCount(0, $result);
    }

    public function testReturnsEmptyArrayForNotExistingName()
    {
        $result = User::withName('Darth Vader')->get();
        $this->assertCount(0, $result);
    }

    /**
     * Test that an empty array gets returned for permissions
     * if the user doesn't have any roles assigned.
     *
     * @return void
     */
    public function testEmptyPermissionsForUserWithoutRoles()
    {
        $user = factory(User::class)->create();
        $this->assertCount(0, $user->permissions);
    }

    /**
     * Test that an empty array gets returned for permissions if
     * the roles doesn't have permissions.
     *
     * @return void
     */
    public function testEmptyPermissionsForRolesWithoutPermissions()
    {
        $user = factory(User::class)->create();
        $user->roles()->attach(factory(Role::class)->create()->id);
        $this->assertCount(0, $user->permissions);
    }

    /**
     * Test that if user has two roles with same permission that name gets only
     * returned once.
     *
     * @return void
     */
    public function testUniquePermissionNames()
    {
        $user = factory(User::class)->create();
        $roleA = factory(Role::class)->create();
        $roleB = factory(Role::class)->create();
        $permission = factory(Permission::class)->create();
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->assertEquals([$permission->name], $user->permissions);
    }
}
