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
        $user       = factory(User::class)->create();
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create();
        $role->permissions()->attach($permission);
        $this->assertFalse($user->can($permission->name));
        $user->roles()->attach($role);
        $this->assertTrue($user->can($permission->name));
    }

    /**
     * Test for non existing permission
     */
    public function testNonExistingPermission()
    {
        $user       = factory(User::class)->create();
        $this->assertFalse($user->can($this->faker->word));
    }
}
