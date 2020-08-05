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
        $user       = factory(User::class)->create();
        $roleA      = factory(Role::class)->create();
        $roleB      = factory(Role::class)->create();
        $permission = factory(Permission::class)->create();
        $roleA->permissions()->attach($permission->id);
        $roleB->permissions()->attach($permission->id);
        $user->roles()->attach([$roleA->id, $roleB->id]);

        $this->assertEquals([$permission->name], $user->permissions);
    }
}
