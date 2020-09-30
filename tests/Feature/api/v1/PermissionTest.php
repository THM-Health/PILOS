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
                return ['id' => $permission['id'], 'name' => $permission['name']];
            }, $permissions)]);
    }
}
