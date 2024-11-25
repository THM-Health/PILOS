<?php

namespace Tests\Backend\Unit;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase,WithFaker;

    /**
     * Check if 'can' responds with the correct permission result
     */
    public function test_user_has_permission()
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();
        $role->permissions()->attach($permission);
        $this->assertFalse($user->can($permission->name));
        $user->roles()->attach($role);
        $this->assertTrue($user->can($permission->name));
    }

    /**
     * Check if user inherits permissions from other permissions
     */
    public function test_user_has_inherited_permission()
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();
        $inheritedPermission = Permission::factory()->create();

        $role->permissions()->attach($permission);
        $user->roles()->attach($role);

        $this->assertFalse($user->can($inheritedPermission->name));
        Permission::setIncludedPermissions($permission->name, [$inheritedPermission->name]);
        $this->assertTrue($user->can($inheritedPermission->name));
    }

    /**
     * Check if permissions inheritance only works from parent to child, not child to parent
     */
    public function test_user_has_inherited_permission_reverse()
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();
        $inheritedPermission = Permission::factory()->create();

        $role->permissions()->attach($inheritedPermission);
        $user->roles()->attach($role);

        $this->assertFalse($user->can($permission->name));
        Permission::setIncludedPermissions($permission->name, [$inheritedPermission->name]);
        $this->assertFalse($user->can($permission->name));
    }

    /**
     * Test for non existing permission
     */
    public function test_non_existing_permission()
    {
        $user = User::factory()->create();
        $this->assertFalse($user->can($this->faker->word));
    }
}
