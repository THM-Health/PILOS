<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_index()
    {
        $user = User::factory()->create();
        $permissions = Permission::factory()->count(10)->create()->toArray();

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJsonFragment(['data' => array_map(function ($permission) {
                return ['id' => $permission['id'], 'name' => $permission['name'], 'included_permissions' => []];
            }, $permissions)]);
    }

    public function test_included_permissions_index()
    {
        $user = User::factory()->create();
        $permission = Permission::factory()->create();
        $includedPermission1 = Permission::factory()->create();
        $includedPermission2 = Permission::factory()->create();

        Permission::setIncludedPermissions($permission->name, [$includedPermission1->name, $includedPermission2->name]);
        // check if permissions that include each other cause any problems
        Permission::setIncludedPermissions($includedPermission1->name, [$permission->name]);

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJson(['data' => [
                ['id' => $permission->id, 'name' => $permission->name, 'included_permissions' => [$includedPermission1->id, $includedPermission2->id]],
                ['id' => $includedPermission1->id, 'name' => $includedPermission1->name, 'included_permissions' => [$permission->id]],
                ['id' => $includedPermission2->id, 'name' => $includedPermission2->name],
            ]]);
    }

    public function test_index_with_restrictions()
    {
        $user = User::factory()->create();

        config(['permissions.restrictions' => ['permission1', 'permission2']]);

        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJsonPath('meta', [
                'restrictions' => ['permission1', 'permission2'],
            ]);
    }
}
