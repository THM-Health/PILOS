<?php

namespace Tests\Backend\Unit;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private $users = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->users[] = User::factory()->create([
            'firstname' => 'Max',
            'lastname' => 'Mustermann',
            'email' => 'max.mustermann@example.org',
        ]);

        $this->users[] = User::factory()->create([
            'firstname' => 'John',
            'lastname' => 'Doe',
            'email' => 'john.doe@example.org',
        ]);

        $this->users[] = User::factory()->create([
            'firstname' => 'Erika',
            'lastname' => 'Mustermann',
            'email' => 'erika.mustermann@example.org',
        ]);
    }

    public function test_returns_user_with_given_firstname_part()
    {
        $result = User::withFirstname('hn')->get();
        $this->assertCount(1, $result);
        $this->assertEquals($this->users[1]->firstname, $result[0]->firstname);
        $this->assertEquals($this->users[1]->lastname, $result[0]->lastname);
    }

    public function test_returns_user_with_given_lastname_part()
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

    public function test_returns_user_with_given_name_part()
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

    public function test_returns_empty_array_for_not_existing_name()
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
    public function test_empty_permissions_for_user_without_roles()
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
    public function test_empty_permissions_for_roles_without_permissions()
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
    public function test_unique_permission_names()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $roleB = Role::factory()->create();
        $permission = Permission::factory()->create();
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->assertEquals([$permission->name], $user->permissions);
    }

    /**
     * Testing the calculation of the room limit for this user, based on groups and global settings
     */
    public function test_room_limit_calc()
    {
        $user = User::factory()->create();
        $roleA = Role::factory()->create();
        $roleB = Role::factory()->create();
        $user->roles()->attach([$roleA->id, $roleB->id]);

        // Only global limit, unlimited
        $this->roomSettings->limit = -1;
        $this->roomSettings->save();
        $roleA->room_limit = null;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Only global limit, limited
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = null;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit on one group, other has none, global unlimited
        $this->roomSettings->limit = -1;
        $this->roomSettings->save();
        $roleA->room_limit = 1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Limit on one group, other has none, global limit
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = 1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit of zero on one group, other has none, global limit
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(10, $user->room_limit);

        // Limit of zero on one group, other has none, global unlimited
        $this->roomSettings->limit = -1;
        $this->roomSettings->save();
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Limit of zero on both, global limit
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 0;
        $roleB->save();
        $this->assertEquals(0, $user->room_limit);

        // Limit of zero on both, global unlimited
        $this->roomSettings->limit = -1;
        $this->roomSettings->save();
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 0;
        $roleB->save();
        $this->assertEquals(0, $user->room_limit);

        // Limit of zero in one group, other has higher, global limit
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = 0;
        $roleA->save();
        $roleB->room_limit = 5;
        $roleB->save();
        $this->assertEquals(5, $user->room_limit);

        // Global limit, unlimited one group
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = -1;
        $roleA->save();
        $roleB->room_limit = null;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Global limit, unlimited one group
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = -1;
        $roleA->save();
        $roleB->room_limit = 5;
        $roleB->save();
        $this->assertEquals(-1, $user->room_limit);

        // Different high limits
        $this->roomSettings->limit = 10;
        $this->roomSettings->save();
        $roleA->room_limit = 20;
        $roleA->save();
        $roleB->room_limit = 30;
        $roleB->save();
        $this->assertEquals(30, $user->room_limit);
    }

    public function test_superuser_attribute()
    {
        $user = User::factory()->create();

        $role = Role::factory()->create();
        $superuserRole = Role::factory()->create(['superuser' => true]);

        $user->roles()->sync([$role]);
        $user->refresh();
        $this->assertFalse($user->superuser);

        $user->roles()->sync([$superuserRole]);
        $user->refresh();
        $this->assertTrue($user->superuser);

        $user->roles()->sync([$role->id, $superuserRole]);
        $user->refresh();
        $this->assertTrue($user->superuser);
    }

    public function test_has_external_image_attribute()
    {
        $user = User::factory()->create();
        $user->external_image_hash = 'somehashvalue';
        $this->assertTrue($user->has_external_image);

        $user = User::factory()->create();
        $this->assertFalse($user->has_external_image);

    }
}
