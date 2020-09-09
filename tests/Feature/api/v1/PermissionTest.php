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
        $page_size = 5;
        setting(['pagination_page_size' => $page_size]);

        $user        = factory(User::class)->create();
        $permissions = factory(Permission::class, 10)->create()->toArray();

        $this->getJson(route('api.v1.roles.index'))->assertStatus(401);
        $this->actingAs($user)->getJson(route('api.v1.permissions.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['data' => array_map(function ($permission) {
                return ['id' => $permission['id'], 'name' => $permission['name']];
            }, array_slice($permissions, 0, 5))]);

        $this->getJson(route('api.v1.permissions.index') . '?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['data' => array_map(function ($permission) {
                return ['id' => $permission['id'], 'name' => $permission['name']];
            }, array_slice($permissions, 5, 5))]);
    }
}
