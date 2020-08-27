<?php

namespace Tests\Unit;

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a not default role can be deleted, even if there are
     * permissions or users that are belong to it.
     *
     * @return void
     * @throws \Exception
     */
    public function testNotDefaultRolesDeletion()
    {
        $user       = factory(User::class)->create();
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create();
        $role->permissions()->attach($permission->id);
        $user->roles()->attach($role->id);

        $this->assertTrue($role->delete());
    }

    /**
     * Test that default system roles can't be deleted.
     *
     * @throws \Exception
     */
    public function testDefaultRolesDeletion()
    {
        $role = factory(Role::class)->create([
            'default' => true
        ]);

        $this->assertFalse($role->delete());
    }
}
