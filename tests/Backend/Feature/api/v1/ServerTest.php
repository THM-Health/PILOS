<?php

namespace Tests\Backend\Feature\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Server;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;

/**
 * General server api feature tests
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
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create();
    }

    /**
     * Test to get a list of all servers
     */
    public function test_index()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        $servers = Server::factory()->count(6)->create(['description' => 'test', 'version' => '2.4.5']);
        $serverOnline = Server::factory()->create(['name' => 'serverOnline', 'version' => '2.4.5']);
        $serverOffline = Server::factory()->create(['name' => 'serverOffline', 'version' => '2.4.5', 'error_count' => config('bigbluebutton.server_offline_threshold'), 'recover_count' => 0]);
        $serverUnhealthy = Server::factory()->create(['name' => 'serverUnhealthy', 'version' => '2.4.5', 'error_count' => 1, 'recover_count' => 0]);
        $serverDisabled = Server::factory()->create(['name' => 'serverDisabled', 'status' => ServerStatus::DISABLED, 'version' => null]);
        $serverDraining = Server::factory()->create(['name' => 'serverDraining', 'status' => ServerStatus::DRAINING, 'version' => null]);

        $servers[3]->version = '2.4.4';
        $servers[3]->save();

        $servers[4]->version = '2.4.6';
        $servers[4]->save();

        // Test guests
        $this->getJson(route('api.v1.servers.index'))
            ->assertUnauthorized();

        $this->actingAs($this->user)->getJson(route('api.v1.servers.index'))
            ->assertForbidden();

        // Authenticated user with permission
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.viewAny']);
        $role->permissions()->attach($permission->id);
        $role->users()->attach($this->user->id);

        $this->actingAs($this->user)->getJson(route('api.v1.servers.index'))
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $servers[0]->id])
            ->assertJsonFragment(['id' => $servers[4]->id])
            ->assertJsonFragment(['per_page' => $page_size])
            ->assertJsonFragment(['total' => 11])
            ->assertJsonStructure([
                'meta',
                'links',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'strength',
                        'health',
                        'status',
                        'participant_count',
                        'listener_count',
                        'voice_participant_count',
                        'video_count',
                        'own_meeting_count',
                        'meeting_count',
                        'version',
                        'updated_at',
                        'model_name',
                    ],
                ],
            ])
            ->assertDontSee('base_url')
            ->assertDontSee('secret');

        // Pagination
        $this->getJson(route('api.v1.servers.index').'?page=2')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => $servers[5]->id]);

        // Filtering by name
        $this->getJson(route('api.v1.servers.index').'?name=serverDisabled')
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $serverDisabled->id]);

        // Filtering by name
        $this->getJson(route('api.v1.servers.index').'?name=server')
            ->assertSuccessful()
            ->assertJsonCount(5, 'data')
            ->assertJsonFragment(['id' => $serverOnline->id])
            ->assertJsonFragment(['id' => $serverUnhealthy->id])
            ->assertJsonFragment(['id' => $serverOffline->id])
            ->assertJsonFragment(['id' => $serverDisabled->id])
            ->assertJsonFragment(['id' => $serverDraining->id]);

        // Sorting status asc
        $response = $this->getJson(route('api.v1.servers.index').'?sort_by=status&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data');
        $this->assertEquals(ServerStatus::DISABLED->value, $response->json('data.0.status'));
        $this->assertEquals(ServerStatus::DRAINING->value, $response->json('data.1.status'));
        $this->assertEquals(ServerStatus::ENABLED->value, $response->json('data.2.status'));

        // Sorting status desc
        $response = $this->getJson(route('api.v1.servers.index').'?sort_by=status&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data');
        $this->assertEquals(ServerStatus::ENABLED->value, $response->json('data.0.status'));

        // Sorting name asc
        $this->getJson(route('api.v1.servers.index').'?sort_by=name&sort_direction=asc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => Server::orderBy('name')->first()->id])
            ->assertJsonMissing(['id' => Server::orderByDesc('name')->first()->id]);

        // Sorting name desc
        $this->getJson(route('api.v1.servers.index').'?sort_by=name&sort_direction=desc')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data')
            ->assertJsonFragment(['id' => Server::orderByDesc('name')->first()->id])
            ->assertJsonMissing(['id' => Server::orderBy('name')->first()->id]);

        // Check server health
        $response = $this->getJson(route('api.v1.servers.index').'?sort_by=name&sort_direction=asc&name=server')
            ->assertSuccessful()
            ->assertJsonCount(5, 'data');

        // Disabled server
        $this->assertNull($response->json('data.0.health'));
        // Draining server
        $this->assertEquals(ServerHealth::ONLINE->value, $response->json('data.1.health'));
        // Offline server
        $this->assertEquals(ServerHealth::OFFLINE->value, $response->json('data.2.health'));
        // Online server
        $this->assertEquals(ServerHealth::ONLINE->value, $response->json('data.3.health'));
        // Unhealthy server
        $this->assertEquals(ServerHealth::UNHEALTHY->value, $response->json('data.4.health'));

        // Request with forced usage update, should see that the online servers are now unhealthy (because it's fake data)
        $response = $this->getJson(route('api.v1.servers.index').'?sort_by=name&sort_direction=asc&name=server&update_usage=true')
            ->assertSuccessful()
            ->assertJsonCount($page_size, 'data');

        // Disabled server
        $this->assertNull($response->json('data.0.health'));
        // Draining server
        $this->assertEquals(ServerHealth::UNHEALTHY->value, $response->json('data.1.health'));
        // Offline server
        $this->assertEquals(ServerHealth::OFFLINE->value, $response->json('data.2.health'));
        // Online server
        $this->assertEquals(ServerHealth::UNHEALTHY->value, $response->json('data.3.health'));
        // Unhealthy server
        $this->assertEquals(ServerHealth::UNHEALTHY->value, $response->json('data.4.health'));
    }

    /**
     * Test to view single server
     */
    public function test_show()
    {
        $server = Server::factory()->create();

        // Test guests
        $this->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.view']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        $server->refresh();

        // Test with authorized user
        $this->actingAs($this->user)->getJson(route('api.v1.servers.show', ['server' => $server->id]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $server->id,
                'name' => $server->name,
                'description' => $server->description,
                'base_url' => $server->base_url,
                'secret' => $server->secret,
                'strength' => $server->strength,
                'status' => $server->status,
                'health' => $server->health->value,
                'participant_count' => $server->participant_count,
                'listener_count' => $server->listener_count,
                'voice_participant_count' => $server->voice_participant_count,
                'video_count' => $server->video_count,
                'own_meeting_count' => $server->meetings()->count(),
                'meeting_count' => $server->meeting_count,
                'version' => $server->version,
                'updated_at' => $server->updated_at,
                'model_name' => $server->model_name,
            ]);

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
    public function test_create()
    {
        $server = Server::factory()->make();
        $data = [
            'name' => $server->name,
            'description' => $server->description,
            'base_url' => $server->base_url,
            'secret' => $server->secret,
            'strength' => 5,
            'status' => ServerStatus::ENABLED->value,
        ];

        // Test guests
        $this->postJson(route('api.v1.servers.store'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.create']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, invalid server is tested and set to offline
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['base_url' => $server->base_url, 'description' => $server->description, 'secret' => $server->secret, 'strength' => 5, 'status' => ServerStatus::ENABLED->value, 'health' => ServerHealth::UNHEALTHY]
            );

        // Test with some existing base url
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertJsonValidationErrors(['base_url']);

        // Test with invalid data
        $data['base_url'] = 'test';
        $data['name'] = '';
        $data['secret'] = '';
        $data['strength'] = 1000;
        $data['status'] = 10;
        $this->actingAs($this->user)->postJson(route('api.v1.servers.store'), $data)
            ->assertJsonValidationErrors(['base_url', 'secret', 'name', 'strength', 'status']);
    }

    /**
     * Test to update a server
     */
    public function test_update()
    {
        $server = Server::factory()->create(['base_url' => 'https://host1.notld/bigbluebutton/', 'status' => ServerStatus::DISABLED]);
        $server2 = Server::factory()->create(['base_url' => 'https://host2.notld/bigbluebutton/', 'status' => ServerStatus::DISABLED]);

        $data = [
            'name' => $server->name,
            'description' => $server->description,
            'base_url' => $server->base_url,
            'secret' => $server->secret,
            'strength' => $server->strength,
            'status' => ServerStatus::DISABLED->value,
        ];

        // Test guests
        $this->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.update']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with authorized user, without updated at
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        $data['updated_at'] = $server->updated_at;

        // Test with authorized user, with updated at
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment(
                ['base_url' => $server->base_url, 'secret' => $server->secret, 'status' => $server->status->value]
            );

        // Change health to offline if server is not reachable
        $server->refresh();
        $data['status'] = ServerStatus::ENABLED->value;
        $data['updated_at'] = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertSuccessful()
            ->assertJsonFragment([
                'status' => ServerStatus::ENABLED->value,
                'health' => ServerHealth::UNHEALTHY->value,
            ]);

        // Test with base url of an other server
        $server->refresh();
        $data['base_url'] = $server2->base_url;
        $data['updated_at'] = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertJsonValidationErrors(['base_url']);

        // Test with invalid data
        $server->refresh();
        $data['base_url'] = 'test';
        $data['name'] = '';
        $data['secret'] = '';
        $data['strength'] = 1000;
        $data['status'] = 10;
        $data['updated_at'] = $server->updated_at;
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertJsonValidationErrors(['base_url', 'secret', 'name', 'strength', 'status']);

        // Test deleted
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $server->delete();
        $this->actingAs($this->user)->putJson(route('api.v1.servers.update', ['server' => $server->id]), $data)
            ->assertNotFound();
    }

    /**
     * Test to delete a server
     */
    public function test_delete()
    {
        $server = Server::factory()->create();

        // Test guests
        $this->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.delete']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Try delete while status is not disabled
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        // Disable server
        $server->status = ServerStatus::DISABLED;
        $server->save();

        // Create new running meeting on the server
        $meeting = Meeting::factory()->create(['server_id' => $server->id, 'end' => null]);

        // Try delete while meeting still running
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value);

        // End meeting
        $meeting->end = date('Y-m-d H:i:s');
        $meeting->save();

        // Test delete
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertSuccessful();

        // Test delete again
        $this->actingAs($this->user)->deleteJson(route('api.v1.servers.destroy', ['server' => $server->id]))
            ->assertNotFound();

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
    }

    /**
     * Test to check api connection
     */
    public function test_check()
    {
        $invalidSecret = 't64e8rtefererrg43erbgffrgz';
        $validSecret = '8d8e8rtefererrg43erbgffrgz';

        $validHost = 'https://bbb-valid.notld/bigbluebutton/';
        $invalidHost = 'https://bbb-invalid.notld/bigbluebutton/';

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($validHost, $validSecret);
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../../Fixtures/GetMeetings-1.xml')));

        $data = ['base_url' => $invalidHost, 'secret' => $invalidSecret];

        // Test guests
        $this->postJson(route('api.v1.servers.check'), $data)
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test with invalid api details
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok' => false, 'secret_ok' => false]);

        // Test with invalid secret
        $data = ['base_url' => $validHost, 'secret' => $invalidSecret];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok' => true, 'secret_ok' => false]);

        // Test with valid api details
        $data = ['base_url' => $validHost, 'secret' => $validSecret];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJson(['connection_ok' => true, 'secret_ok' => true]);

        // Test with invalid data
        $data = ['base_url' => 'test', 'secret' => ''];
        $this->actingAs($this->user)->postJson(route('api.v1.servers.check'), $data)
            ->assertJsonValidationErrors(['base_url', 'secret']);
    }

    /**
     * Test panic server
     */
    public function test_panic()
    {
        $server = Server::factory()->create();

        // Test guests
        $this->getJson(route('api.v1.servers.panic', ['server' => $server]))
            ->assertUnauthorized();

        // Test logged in users
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server' => $server]))
            ->assertForbidden();

        // Authorize user for view servers
        $role = Role::factory()->create();
        $permission = Permission::firstOrCreate(['name' => 'servers.viewAny']);
        $role->permissions()->attach($permission);
        $this->user->roles()->attach($role);

        // Test without update permission
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server' => $server]))
            ->assertForbidden();

        // Give update permission
        $permission = Permission::firstOrCreate(['name' => 'servers.update']);
        $role->permissions()->attach($permission);

        $meeting = Meeting::factory()->create(['server_id' => $server->id, 'end' => null]);

        // Test with update permission, but as the server is fake, ending the meeting will not work
        $this->actingAs($this->user)->getJson(route('api.v1.servers.panic', ['server' => $server]))
            ->assertSuccessful()
            ->assertJson(['total' => 1, 'success' => 0]);

        $meeting->refresh();
        $server->refresh();

        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNull($meeting->end);
    }
}
