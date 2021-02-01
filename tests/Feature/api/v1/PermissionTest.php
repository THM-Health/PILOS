<?php

namespace Tests\Feature\api\v1;

use App\Permission;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testIndex()
    {
        $user        = factory(User::class)->create();
        $permissions = factory(Permission::class, 10)->create()->toArray();

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJsonFragment(['data' => array_map(function ($permission) {
                return ['id' => $permission['id'], 'name' => $permission['name'],'includedPermissions'=>[]];
            }, $permissions)]);
    }

    public function testIncludedPermissionsIndex()
    {
        $user                = factory(User::class)->create();
        $permission          = factory(Permission::class)->create();
        $includedPermission1 = factory(Permission::class)->create();
        $includedPermission2 = factory(Permission::class)->create();

        Permission::SetupIncludedPermissions($permission->name, [$includedPermission1->name,$includedPermission2->name]);
        // check if permissions that include each other cause any problems
        Permission::SetupIncludedPermissions($includedPermission1->name, [$permission->name]);

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJson(['data' => [
                ['id'=>$permission->id,'name'=>$permission->name,'includedPermissions'=>[$includedPermission1->id,$includedPermission2->id]],
                ['id'=> $includedPermission1->id,'name'=>$includedPermission1->name, 'includedPermissions'=>[$permission->id]],
                ['id'=> $includedPermission2->id,'name'=>$includedPermission2->name]
            ]]);
    }
}
