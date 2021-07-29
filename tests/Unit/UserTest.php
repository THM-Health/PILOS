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

        $this->users[] = User::factory()->create([
            'firstname' => 'Max',
            'lastname'  => 'Mustermann'
        ]);

        $this->users[] = User::factory()->create([
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $this->users[] = User::factory()->create([
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
        $user = User::factory()->create();
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
        $user = User::factory()->create();
        $user->roles()->attach(Role::factory()->create()->id);
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
        $user       = User::factory()->create();
        $roleA      = Role::factory()->create();
        $roleB      = Role::factory()->create();
        $permission = Permission::factory()->create();
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->assertEquals([$permission->name], $user->permissions);
    }

    /**
     * Testing the calculation of the room limit for this user, based on groups and global settings
     */
    public function testRoomLimitCalc()
    {
        $user       = User::factory()->create();
        $roleA      = Role::factory()->create();
        $roleB      = Role::factory()->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        // Only global limit, unlimited
        setting(['room_limit' => '-1']);
        $roleA->room_limit = null;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Only global limit, limited
        setting(['room_limit' => '10']);
        $roleA->room_limit = null;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit on one group, other has none, global unlimited
        setting(['room_limit' => '-1']);
        $roleA->room_limit = 1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Limit on one group, other has none, global limit
        setting(['room_limit' => '10']);
        $roleA->room_limit = 1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit of zero on one group, other has none, global limit
        setting(['room_limit' => '10']);
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit of zero on one group, other has none, global unlimited
        setting(['room_limit' => '-1']);
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Limit of zero on both, global limit
        setting(['room_limit' => '10']);
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 0;
        $roleB->save();
        $this->assertEquals(0, $user->room_limit);

        // Limit of zero on both, global unlimited
        setting(['room_limit' => '-1']);
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 0;
        $roleB->save();
        $this->assertEquals(0, $user->room_limit);

        // Limit of zero in one group, other has higher, global limit
        setting(['room_limit' => '10']);
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 5;
        $roleB->save();
        $this->assertEquals(5, $user->room_limit);

        // Global limit, unlimited one group
        setting(['room_limit' => '10']);
        $roleA->room_limit = -1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Global limit, unlimited one group
        setting(['room_limit' => '10']);
        $roleA->room_limit = -1;
        $roleA->save();
        $roleB->room_limit = 5;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Different high limits
        setting(['room_limit' => '10']);
        $roleA->room_limit = 20;
        $roleA->save();
        $roleB->room_limit = 30;
        $roleB->save();
        $this->assertEquals(30, $user->room_limit);
    }
}
