<?php

namespace Tests\Unit;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase,WithFaker;

    /**
     * Check if 'can' responds with the correct permission result
     */
    public function testUserHasPermission()
    {
        $user       = User::factory()->create();
        $role       = Role::factory()->create();
        $permission = Permission::factory()->create();
        $role->permissions()->attach($permission);
        $this->assertFalse($user->can($permission->name));
        $user->roles()->attach($role);
        $this->assertTrue($user->can($permission->name));
    }

    /**
     * Check if user inherits permissions from other permissions
     */
    public function testUserHasInheritedPermission()
    {
        $user                = User::factory()->create();
        $role                = Role::factory()->create();
        $permission          = Permission::factory()->create();
        $inheritedPermission = Permission::factory()->create();

        $role->permissions()->attach($permission);
        $user->roles()->attach($role);

        $this->assertFalse($user->can($inheritedPermission->name));
        Permission::SetupIncludedPermissions($permission->name, [$inheritedPermission->name]);
        $this->assertTrue($user->can($inheritedPermission->name));
    }

    /**
     * Check if permissions inheritance only works from parent to child, not child to parent
     */
    public function testUserHasInheritedPermissionReverse()
    {
        $user                = User::factory()->create();
        $role                = Role::factory()->create();
        $permission          = Permission::factory()->create();
        $inheritedPermission = Permission::factory()->create();

        $role->permissions()->attach($inheritedPermission);
        $user->roles()->attach($role);

        $this->assertFalse($user->can($permission->name));
        Permission::SetupIncludedPermissions($permission->name, [$inheritedPermission->name]);
        $this->assertFalse($user->can($permission->name));
    }

    /**
     * Test for non existing permission
     */
    public function testNonExistingPermission()
    {
        $user       = User::factory()->create();
        $this->assertFalse($user->can($this->faker->word));
    }
}
