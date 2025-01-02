<?php

namespace Tests\Backend\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoomToken;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

/**
 * General server pool api feature tests
 */
class ServerPoolTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /**
     * Test to get a list of all server pools
     */
    public function test_index()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();
        RoomToken::query()->delete();
        RoomType::query()->delete();
        Server::query()->delete();
        ServerPool::query()->delete();
        $serverPools = ServerPool::factory()->count(9)->create();
        $serverPool1 = ServerPool::factory()->create(['name' => 'testPool']);

        // Test guests
        $this->getJson(route('api.v1.serverPools.index'))
            ->assertUnauthorized();

        $this->actingAs($this->user)->getJson(route('api.v1.serverPools.index'))
            ->assertForbidden();

        // Authenticated user with permission
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'serverPools.viewAny']);
        $role->permissions()->attach($permission->id);
        $role->users()->attach($this->user->id);

        $this->actingAs($this->user)->getJson(route('api.v1.serverPools.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $serverPools[0]->id])
            ->assertJsonFragment(['id' => $serverPools[4]->id])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 10])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'servers_count',
                        'updated_at',
                        'model_name',
                    ],
                ],
            ]);

        // Pagination
        $this->getJson(route('api.v1.serverPools.index').'?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $serverPools[5]->id]);

        // Filtering by name
        $this->getJson(route('api.v1.serverPools.index').'?name=testPool')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $serverPool1->id]);

        // Sorting name asc
        $this->getJson(route('api.v1.serverPools.index').'?sort_by=name&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => ServerPool::orderBy('name')->first()->id])
            ->assertJsonMissing(['id' => ServerPool::orderByDesc('name')->first()->id]);

        // Sorting name desc
        $this->getJson(route('api.v1.serverPools.index').'?sort_by=name&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => ServerPool::orderByDesc('name')->first()->id])
            ->assertJsonMissing(['id' => ServerPool::orderBy('name')->first()->id]);

        // Add fake servers to pools
        $servers = Server::factory()->count(4)->create();
        $serverPools[1]->servers()->sync($servers);
        $serverPools[3]->servers()->sync([$servers[0]->id, $servers[1]->id]);
        $serverPools[6]->servers()->sync([$servers[0]->id]);

        // Sorting amount of servers desc
        $this->getJson(route('api.v1.serverPools.index').'?sort_by=servers_count&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonPath('data.0.id', $serverPools[1]->id)
            ->assertJsonPath('data.1.id', $serverPools[3]->id)
            ->assertJsonPath('data.2.id', $serverPools[6]->id);

        // Sorting amount of servers asc
        $this->getJson(route('api.v1.serverPools.index').'?sort_by=servers_count&sort_direction=asc&page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonPath('data.2.id', $serverPools[6]->id)
            ->assertJsonPath('data.3.id', $serverPools[3]->id)
            ->assertJsonPath('data.4.id', $serverPools[1]->id);
    }

    /**
     * Test to view single server pool
     */
    public function test_show()
    {
        $serverPool = ServerPool::factory()->create();
        $server = Server::factory()->count(5)->create();
        $serverPool->servers()->sync($server);

        // Test guests
        $this->getJson(route('api.v1.serverPools.show', ['serverPool' => $serverPool->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.serverPools.show', ['serverPool' => $serverPool->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'serverPools.view']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.serverPools.show', ['serverPool' => $serverPool->id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $serverPool->id,
                'name' => $serverPool->name,
                'description' => $serverPool->description,
                'servers_count' => $serverPool->servers()->count(),
                'updated_at' => $serverPool->updated_at,
                'model_name' => $serverPool->model_name,
            ])
            ->assertJsonCount(5, 'data.servers');

        // Test deleted
        $serverPool->delete();
        $this->actingAs($this->user)->getJson(route('api.v1.serverPools.show', ['serverPool' => $serverPool->id]))
            ->assertNotFound();
    }

    /**
     * Test to create new server pool
     */
    public function test_create()
    {
        $serverPool = ServerPool::factory()->make();
        $data = [
            'name' => $serverPool->name,
            'description' => $serverPool->description,
        ];

        // Test guests
        $this->postJson(route('api.v1.serverPools.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'serverPools.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, invalid server is tested and set to offline
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['name' => $serverPool->name, 'description' => $serverPool->description, 'servers_count' => 0, 'model_name' => 'ServerPool']
            );

        // Test with some existing name
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertJsonValidationErrors(['name']);

        // Test with invalid data
        $data['name'] = '';
        $data['servers'] = 'test';
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertJsonValidationErrors(['name', 'servers']);

        // Create servers
        $servers = Server::factory()->count(2)->create();

        // Test with invalid servers value
        $data['name'] = 'TestPool';
        $data['servers'] = $servers[0]->id;
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertJsonValidationErrors(['servers']);

        // Test with duplicated servers
        $data['name'] = 'TestPool';
        $data['servers'] = [$servers[0]->id, $servers[0]->id];
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertJsonValidationErrors(['servers.0', 'servers.1']);

        // Test with invalid servers
        $data['name'] = 'TestPool';
        $data['servers'] = [0, $servers[0]->id];
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertJsonValidationErrors(['servers.0']);

        // Test with servers
        $data['name'] = 'TestPool';
        $data['servers'] = [$servers[0]->id, $servers[1]->id];
        $this->actingAs($this->user)->postJson(route('api.v1.serverPools.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['name' => 'TestPool', 'description' => $serverPool->description, 'servers_count' => 2]
            )
            ->assertJsonPath('data.servers.0.id', $servers[0]->id)
            ->assertJsonPath('data.servers.1.id', $servers[1]->id);
    }

    /**
     * Test to update a server pool
     */
    public function test_update()
    {
        $serverPool = ServerPool::factory()->create();
        $serverPool2 = ServerPool::factory()->create();

        $data = [
            'name' => $serverPool->name,
            'description' => $serverPool->description,
        ];

        // Test guests
        $this->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'serverPools.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        $data['updated_at'] = $serverPool->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['name' => $serverPool->name, 'description' => $serverPool->description, 'servers_count' => 0]
            );

        // Test with name of an other server pool
        $serverPool->refresh();
        $data['name'] = $serverPool2->name;
        $data['updated_at'] = $serverPool->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertJsonValidationErrors(['name']);

        // Test with invalid data
        $serverPool->refresh();
        $data['name'] = '';
        $data['servers'] = 'test';
        $data['updated_at'] = $serverPool->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertJsonValidationErrors(['name', 'servers']);

        // Create servers
        $servers = Server::factory()->count(2)->create();

        // Add two servers
        $serverPool->refresh();
        $data['name'] = 'TestPool';
        $data['servers'] = [$servers[0]->id, $servers[1]->id];
        $data['updated_at'] = $serverPool->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertJsonFragment(['name' => 'TestPool', 'description' => $serverPool->description, 'servers_count' => 2])
            ->assertJsonPath('data.servers.0.id', $servers[0]->id)
            ->assertJsonPath('data.servers.1.id', $servers[1]->id);

        // Remove one server
        $serverPool->refresh();
        $data['name'] = 'TestPool';
        $data['servers'] = [$servers[0]->id];
        $data['updated_at'] = $serverPool->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertJsonFragment(['name' => 'TestPool', 'description' => $serverPool->description, 'servers_count' => 1])
            ->assertJsonPath('data.servers.0.id', $servers[0]->id);

        // Remove all servers
        $serverPool->refresh();
        $data['name'] = 'TestPool';
        $data['updated_at'] = $serverPool->updated_at;
        unset($data['servers']);
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertJsonFragment(['name' => 'TestPool', 'description' => $serverPool->description, 'servers_count' => 0]);

        // Test deleted
        $serverPool->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.serverPools.update', ['serverPool' => $serverPool->id]), $data)
            ->assertNotFound();
    }

    /**
     * Test to delete a server pool
     */
    public function test_delete()
    {
        $serverPool = ServerPool::factory()->create();
        $roomTypes = RoomType::factory()->count(2)->create(['server_pool_id' => $serverPool]);

        // Test guests
        $this->deleteJson(route('api.v1.serverPools.destroy', ['serverPool' => $serverPool->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.serverPools.destroy', ['serverPool' => $serverPool->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::factory()->create(['name' => 'serverPools.delete']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test delete with room type attached
        $this->actingAs($this->user)->deleteJson(route('api.v1.serverPools.destroy', ['serverPool' => $serverPool->id]))
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value)
            ->assertJsonCount(2, 'room_types')
            ->assertJsonFragment(['id' => $roomTypes[0]->id, 'name' => $roomTypes[0]->name]);
        $roomTypes[0]->delete();
        $roomTypes[1]->delete();

        // Test delete
        $this->actingAs($this->user)->deleteJson(route('api.v1.serverPools.destroy', ['serverPool' => $serverPool->id]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.serverPools.destroy', ['serverPool' => $serverPool->id]))
            ->assertNotFound();

        $this->assertDatabaseMissing('servers', ['id' => $serverPool->id]);
    }
}
