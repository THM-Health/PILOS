<?php

namespace Tests\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\ServerStatus;
use App\Meeting;
use App\Permission;
use App\Role;
use App\Server;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * General server api feature tests
 * @package Tests\Feature\api\v1\Server
 */
class ServerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = factory(User::class)->create();
    }

    /**
     * Test to get a list of all servers
     */
    public function testIndex()
    {
        $page_size = 5;
        setting(['pagination_page_size' => $page_size]);

        $servers  = factory(Server::class, 8)->create(['description'=>'test']);
        $server01 = factory(Server::class)->create(['description'=>'server01','status'=>ServerStatus::DISABLED]);
        $server02 = factory(Server::class)->create(['description'=>'server02','status'=>ServerStatus::OFFLINE]);

        // Test guests
        $this->getJson(route('api.v1.servers.index'))
            ->assertUnauthorized();

        $this->actingAs($this->user)->getJson(route('api.v1.servers.index'))
            ->assertForbidden();

        // Authenticated user with permission
        $role       = factory(Role::class)->create(['default' => true]);
        $permission = Permission::firstOrCreate([ 'name' => 'servers.viewAny' ]);
        $role->permissions()->attach($permission->id);
        $role->users()->attach($this->user->id);

        $this->actingAs($this->user)->getJson(route('api.v1.servers.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $servers[0]->id])
            ->assertJsonFragment(['id' => $servers[4]->id])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 10])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'description',
                        'strength',
                        'status',
                        'participant_count',
                        'listener_count',
                        'voice_participant_count',
                        'video_count',
                        'meeting_count',
                        'updated_at',
                        'model_name'
                    ]
                ]
            ])
        ->assertDontSee('base_url')
        ->assertDontSee('salt');

        // Pagination
        $this->getJson(route('api.v1.servers.index') . '?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $servers[5]->id]);

        // Filtering by description
        $this->getJson(route('api.v1.servers.index') . '?description=server01')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $server01->id]);

        // Filtering by description
        $this->getJson(route('api.v1.servers.index') . '?description=server')
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $server01->id])
            ->assertJsonFragment(['id' => $server02->id]);

        // Sorting status asc
        $response = $this->getJson(route('api.v1.servers.index') . '?sort_by=status&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data');
        $this->assertEquals(ServerStatus::DISABLED, $response->json('data.0.status'));
        $this->assertEquals(ServerStatus::OFFLINE, $response->json('data.1.status'));
        $this->assertEquals(ServerStatus::ONLINE, $response->json('data.2.status'));

        // Sorting status desc
        $response = $this->getJson(route('api.v1.servers.index') . '?sort_by=status&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data');
        $this->assertEquals(ServerStatus::ONLINE, $response->json('data.0.status'));
    }

    /**
     * Test to view single server
     */
    public function testShow()
    {
        $server = factory(Server::class)->create();

        // Test guests
        $this->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.view']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $server->refresh();

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id'                      => $server->id,
                'description'             => $server->description,
                'base_url'                => $server->base_url,
                'salt'                    => $server->salt,
                'strength'                => $server->strength,
                'status'                  => $server->status,
                'participant_count'       => $server->participant_count,
                'listener_count'          => $server->listener_count,
                'voice_participant_count' => $server->voice_participant_count,
                'video_count'             => $server->video_count,
                'meeting_count'           => $server->meeting_count,
                'updated_at'              => $server->updated_at,
                'model_name'              => $server->model_name,
                    ]
            );

        // Test deleted
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $server->delete();
        $this->actingAs($this->user)->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertNotFound();
    }

    /**
     * Test to create new server
     */
    public function testCreate()
    {
        $server = factory(Server::class)->make();
        $data   = [
            'description' => $server->description,
            'base_url'    => $server->base_url,
            'salt'        => $server->salt,
            'strength'    => 5,
            'disabled'    => false,
        ];

        // Test guests
        $this->postJson(route('api.v1.servers.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, invalid server is tested and set to offline
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['base_url'=>$server->base_url,'description'=>$server->description,'salt'=>$server->salt,'strength'=>5,'status'=>ServerStatus::OFFLINE]
            );

        // Test with some existing base url
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertJsonValidationErrors(['base_url']);

        // Test with invalid data
        $data['base_url']      = 'test';
        $data['description']   = '';
        $data['salt']          = '';
        $data['strength']      = 1000;
        $data['disabled']      = 10;
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertJsonValidationErrors(['base_url','salt','description','strength','disabled']);
    }

    /**
     * Test to update a server
     */
    public function testUpdate()
    {
        $server  = factory(Server::class)->create(['base_url'=>'https://host1.notld/bigbluebutton/','status'=>ServerStatus::DISABLED]);
        $server2 = factory(Server::class)->create(['base_url'=>'https://host2.notld/bigbluebutton/','status'=>ServerStatus::DISABLED]);

        $data = [
            'description' => $server->description,
            'base_url'    => $server->base_url,
            'salt'        => $server->salt,
            'strength'    => $server->strength,
            'disabled'    => true,
        ];

        // Test guests
        $this->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL);

        $data['updated_at'] = $server->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['base_url'=>$server->base_url,'salt'=>$server->salt,'status'=>$server->status]
            );

        // Change status to offline if server is not reachable
        $server->refresh();
        $data['disabled']     = false;
        $data['updated_at']   = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['status'=>ServerStatus::OFFLINE]
            );

        // Test with base url of an other server
        $server->refresh();
        $data['base_url']   = $server2->base_url;
        $data['updated_at'] = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertJsonValidationErrors(['base_url']);

        // Test with invalid data
        $server->refresh();
        $data['base_url']      = 'test';
        $data['description']   = '';
        $data['salt']          = '';
        $data['strength']      = 1000;
        $data['disabled']      = 10;
        $data['updated_at']    = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertJsonValidationErrors(['base_url','salt','description','strength','disabled']);

        // Test deleted
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $server->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server'=>$server->id]), $data)
            ->assertNotFound();
    }

    /**
     * Test to delete a server
     */
    public function testDelete()
    {
        $server = factory(Server::class)->create();

        // Test guests
        $this->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.delete']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Try delete while status is not disabled
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertStatus(CustomStatusCodes::STALE_MODEL);

        // Disable server
        $server->status = ServerStatus::DISABLED;
        $server->save();

        // Create new running meeting on the server
        $meeting = factory(Meeting::class)->create(['server_id'=>$server->id,'end'=>null]);

        // Try delete while meeting still running
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertStatus(CustomStatusCodes::STALE_MODEL);

        // End meeting
        $meeting->end = date('Y-m-d H:i:s');
        $meeting->save();

        // Test delete
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server'=>$server->id]))
            ->assertNotFound();

        $this->assertDatabaseMissing('servers', ['id'=>$server->id]);
    }

    /**
     * Test to check api connection
     */
    public function testCheck()
    {
        // Adding server(s)
        $this->seed('ServerSeeder');
        $server = Server::all()->first();

        $data = ['base_url'=>'https://host.tld/bigbluebutton','salt'=>'t64e8rtefererrg43erbgffrgz'];

        // Test guests
        $this->postJson(route('api.v1.servers.check'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertForbidden();

        // Authorize user
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with invalid api details
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok'=>false,'salt_ok'=>false]);

        // Test with invalid salt
        $data = ['base_url'=>$server->base_url,'salt'=>'t64e8rtefererrg43erbgffrgz'];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok'=>true,'salt_ok'=>false]);

        // Test with valid api details
        $data = ['base_url'=>$server->base_url,'salt'=>$server->salt];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok'=>true,'salt_ok'=>true]);

        // Test with invalid data
        $data = ['base_url'=>'test','salt'=>''];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJsonValidationErrors(['base_url','salt']);
    }

    /**
     * Test panic server
     */
    public function testPanic()
    {
        $server = factory(Server::class)->create();

        // Test guests
        $this->getJson(route('api.v1.servers.panic', ['server'=>$server]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server'=>$server]))
            ->assertForbidden();

        // Authorize user for view servers
        $role       = factory(Role::class)->create();
        $permission = factory(Permission::class)->create(['name' => 'servers.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test without update permission
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server'=>$server]))
            ->assertForbidden();

        // Give update permission
        $permission = factory(Permission::class)->create(['name' => 'servers.update']);
        $role->permissions()->attach($permission);

        $meeting = factory(Meeting::class)->create(['server_id'=>$server->id,'end'=>null]);

        // Test without update permission
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server'=>$server]))
            ->assertSuccessful()
            ->assertJson(['total'=>1,'success'=>1]);

        $meeting->refresh();
        $server->refresh();

        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNotNull($meeting->end);
    }
}
