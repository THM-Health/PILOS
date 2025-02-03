<?php

namespace Tests\Backend\Unit;

use App\Enums\ServerStatus;
use App\Models\Role;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\ServerPool;
use App\Models\User;
use App\Services\ProvisioningService;
use App\Settings\GeneralSettings;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;
use UnexpectedValueException;

class ProvisioningServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->svc = new ProvisioningService;

        $this->testServer = (object) [
            'name' => 'Testserver',
            'description' => 'a fancy description',
            'endpoint' => 'https://bbb.testdoma.in',
            'secret' => 'Xuper$3cr37',
            'strength' => 5,
            'status' => 'enabled',
        ];
        $this->testServerPool = (object) [
            'name' => 'Testserverpool',
            'description' => 'a fancy description',
            'servers' => [$this->testServer->name],
        ];
        $this->testRoomType = (object) [
            'name' => 'Testroomtype',
            'description' => 'a fancy description',
            'color' => '#aaaaaa',
            'server_pool' => $this->testServerPool->name,
        ];
        $this->testRole = (object) [
            'name' => 'Testrole',
            'permissions' => [
                'rooms' => [
                    'viewAll',
                    'manage',
                ],
                'meetings' => [
                    'viewAny',
                ],
                'settings' => [
                    'viewAny',
                    'update',
                ],
                'users' => [
                    'viewAny',
                    'view',
                    'update',
                    'create',
                    'delete',
                ],
                'roles' => [
                    'viewAny',
                    'view',
                ],
                'roomTypes' => [
                    'view',
                    'update',
                    'create',
                    'delete',
                ],
                'servers' => [
                    'viewAny',
                    'view',
                ],
                'serverPools' => [
                    'viewAny',
                    'view',
                ],
            ],
        ];
        $this->testUser = (object) [
            'firstname' => 'Maurice',
            'lastname' => 'Moss',
            'email' => 'moss@reynholm-industries.co.uk',
            'password' => 'Xuper$3cre7',
            'authenticator' => 'local',
            'roles' => ['User'],
            'locale' => 'en',
            'timezone' => 'Europe/London',
        ];
        $this->testSettings = (object) [
            'general' => [
                'name' => 'Example company - PILOS',
                'help_url' => 'https://help.bbb.example.biz',
                'legal_notice_url' => 'https://legal.bbb.example.biz',
                'privacy_policy_url' => 'https://privacy.bbb.example.biz',
                'default_timezone' => 'Europe/Berlin',
            ],
            'recording' => [
                'server_usage_enabled' => false,
                'meeting_usage_enabled' => false,
                'recording_retention_period' => 730,
            ],
        ];

        for ($i = 1; $i <= 3; $i++) {
            $server = new Server;
            $server->name = "Existing {$this->testServer->name} $i";
            $server->base_url = $this->testServer->endpoint;
            $server->secret = $this->testServer->secret;
            $server->status = ServerStatus::ENABLED;
            $server->save();

            $serverPool = new ServerPool;
            $serverPool->name = "Existing {$this->testServerPool->name} $i";
            $serverPool->save();
            $serverPool->servers()->save($server);

            $roomType = new RoomType;
            $roomType->name = "Existing {$this->testRoomType->name} $i";
            $roomType->description = $this->testRoomType->description;
            $roomType->color = $this->testRoomType->color;
            $roomType->serverPool()->associate($serverPool);
            $roomType->save();

            $user = new User;
            $user->firstname = "{$this->testUser->firstname} $i";
            $user->lastname = $this->testUser->lastname;
            $user->email = $this->testUser->email;
            $user->password = \Hash::make($this->testUser->password);
            $user->authenticator = $this->testUser->authenticator;
            $user->locale = $this->testUser->locale;
            $user->timezone = $this->testUser->timezone;
            $user->save();
        }
    }

    /**
     * Test server creation
     */
    public function test_server_create()
    {
        $this->svc->server->create($this->testServer);
        $server = Server::firstWhere('name', $this->testServer->name);
        $this->assertNotNull($server);
        $this->assertEquals($this->testServer->description, $server->description);
        $this->assertEquals($this->testServer->endpoint, $server->base_url);
        $this->assertEquals($this->testServer->secret, $server->secret);
        $this->assertEquals($this->testServer->strength, $server->strength);
        $this->assertEquals(ServerStatus::ENABLED, $server->status);
    }

    /**
     * Test server creation with invalid server status
     */
    public function test_server_create_invalid_status()
    {
        $this->testServer->status = 'fnord';
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server definition');
        $this->svc->server->create($this->testServer);
        $this->assertNull(Server::firstWhere('name', $this->testServer->name));
    }

    /**
     * Test server creation with invalid strength
     */
    public function test_server_create_invalid_strength()
    {
        $this->testServer->strength = 42;
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server definition');
        $this->svc->server->create($this->testServer);
        $this->assertNull(Server::firstWhere('name', $this->testServer->name));
    }

    /**
     * Test server creation with incomplete properties
     */
    public function test_server_create_incomplete()
    {
        unset($this->testServer->secret);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server definition');
        $this->svc->server->create($this->testServer);
        $this->assertNull(Server::firstWhere('name', $this->testServer->name));
    }

    /**
     * Test deletion of all servers
     */
    public function test_server_delete_all()
    {
        $this->assertEquals(3, count(Server::all()));
        $this->svc->server->destroy();
        $this->assertEquals(0, count(Server::all()));

    }

    /**
     * Test deletion of specified server
     */
    public function test_server_delete_named()
    {
        $this->assertEquals(3, count(Server::all()));
        $this->svc->server->destroy(['name' => "Existing {$this->testServer->name} 2"]);
        $this->assertEquals(2, count(Server::all()));
        $this->assertNull(Server::firstWhere('name', "Existing {$this->testServer->name} 2"));
        $this->assertNotNull(Server::firstWhere('name', "Existing {$this->testServer->name} 1"));
        $this->assertNotNull(Server::firstWhere('name', "Existing {$this->testServer->name} 3"));
    }

    /**
     * Test server pool creation
     */
    public function test_server_pool_create()
    {
        $this->svc->server->create($this->testServer);
        $this->svc->serverPool->create($this->testServerPool);
        $serverPool = ServerPool::firstWhere('name', $this->testServerPool->name);
        $this->assertNotNull($serverPool);
        $this->assertEquals($this->testServerPool->description, $serverPool->description);
        $servers = array_map(fn ($it) => $it->name, $serverPool->servers->all());
        $this->assertEquals($this->testServerPool->servers, $servers);
    }

    /**
     * Test server pool creation with a non-existing server
     */
    public function test_server_pool_create_non_existing_server()
    {
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server pool definition');
        $this->svc->serverPool->create($this->testServerPool);
        $this->assertNull(ServerPool::firstWhere('name', $this->testServerPool->name));
    }

    /**
     * Test server pool creation with a duplicate server
     */
    public function test_server_pool_create_duplicate_server()
    {
        $this->testServerPool->servers = [$this->testServer->name, $this->testServer->name];
        $this->svc->server->create($this->testServer);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server pool definition');
        $this->svc->serverPool->create($this->testServerPool);
        $this->assertNull(ServerPool::firstWhere('name', $this->testServerPool->name));
    }

    /**
     * Test server pool creation with incomplete properties
     */
    public function test_server_pool_create_incomplete()
    {
        unset($this->testServerPool->servers);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server pool definition');
        $this->svc->serverPool->create($this->testServerPool);
        $this->assertNull(ServerPool::firstWhere('name', $this->testServerPool->name));
    }

    /**
     * Test deletion of all server pools
     */
    public function test_server_pool_delete_all()
    {
        $this->assertEquals(4, count(ServerPool::all()));
        array_map(fn ($it) => $it->delete(), RoomType::all()->all());
        $this->svc->serverPool->destroy();
        $this->assertEquals(0, count(ServerPool::all()));
    }

    /**
     * Test deletion of all server pools without prior room type deletion
     */
    public function test_server_pool_delete_all_with_room_types()
    {
        $this->assertEquals(4, count(ServerPool::all()));
        $this->svc->serverPool->destroy();
        $this->assertEquals(4, count(ServerPool::all()));
    }

    /**
     * Test deletion of specified server pool
     */
    public function test_server_pool_delete_named()
    {
        $this->assertEquals(4, count(ServerPool::all()));
        RoomType::firstWhere(['name' => "Existing {$this->testRoomType->name} 2"])->delete();
        $this->svc->serverPool->destroy(['name' => "Existing {$this->testServerPool->name} 2"]);
        $this->assertEquals(3, count(ServerPool::all()));
        $this->assertNull(ServerPool::firstWhere('name', "Existing {$this->testServerPool->name} 2"));
        $this->assertNotNull(ServerPool::firstWhere('name', "Existing {$this->testServerPool->name} 1"));
        $this->assertNotNull(ServerPool::firstWhere('name', "Existing {$this->testServerPool->name} 3"));
    }

    /**
     * Test room type creation
     */
    public function test_room_type_create()
    {
        $this->svc->server->create($this->testServer);
        $this->svc->serverPool->create($this->testServerPool);
        $this->svc->roomType->create($this->testRoomType);
        $roomType = RoomType::firstWhere('name', $this->testRoomType->name);
        $this->assertNotNull($roomType);
        $this->assertEquals($this->testRoomType->description, $roomType->description);
        $this->assertEquals($this->testRoomType->color, $roomType->color);
        $this->assertEquals($this->testRoomType->server_pool, $roomType->serverPool->name);
    }

    /**
     * Test room type creation with non-existing server pool
     */
    public function test_room_type_create_non_existing_server_pool()
    {
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid room type definition');
        $this->svc->roomType->create($this->testRoomType);
        $this->assertNull(RoomType::firstWhere('name', $this->testRoomType->name));
    }

    /**
     * Test room type creation with incomplete properties
     */
    public function test_room_type_create_incomplete()
    {
        unset($this->testRoomType->server_pool);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid room type definition');
        $this->svc->roomType->create($this->testRoomType);
        $this->assertNull(RoomType::firstWhere('name', $this->testRoomType->name));
    }

    /**
     * Test deletion of all room types
     */
    public function test_room_type_delete_all()
    {
        $this->assertEquals(7, count(RoomType::all()));
        $this->svc->roomType->destroy();
        $this->assertEquals(0, count(RoomType::all()));
    }

    /**
     * Test deletion of specified room type
     */
    public function test_room_type_delete_named()
    {
        $this->assertEquals(7, count(RoomType::all()));
        $this->svc->roomType->destroy(['name' => "Existing {$this->testRoomType->name} 2"]);
        $this->assertEquals(6, count(RoomType::all()));
        $this->assertNull(RoomType::firstWhere('name', "Existing {$this->testRoomType->name} 2"));
        $this->assertNotNull(RoomType::firstWhere('name', "Existing {$this->testRoomType->name} 1"));
        $this->assertNotNull(RoomType::firstWhere('name', "Existing {$this->testRoomType->name} 3"));
    }

    /**
     * Test role creation
     */
    public function test_role_create()
    {
        $this->svc->role->create($this->testRole);
        $role = Role::firstWhere('name', $this->testRole->name);
        $this->assertNotNull($role);
        foreach ($this->testRole->permissions as $group => $perms) {
            foreach ($perms as $perm) {
                $wanted_permissions[] = "$group.$perm";
            }
        }
        $saved_permissions = array_map(fn ($it) => $it->name, $role->permissions->all());
        $this->assertEquals(sort($wanted_permissions), sort($saved_permissions));
    }

    /**
     * Test role creation with invalid permissions
     */
    public function test_role_create_invalid()
    {
        $this->testRole->permissions['fnord'] = ['foo', 'bar'];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid role definition');
        $this->svc->role->create($this->testRole);
        $this->assertNull(Role::firstWhere('name', $this->testRole->name));
    }

    /**
     * Test role creation with incomplete permissions spec
     */
    public function test_role_create_incomplete()
    {
        unset($this->testRole->permissions);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid role definition');
        $this->svc->role->create($this->testRole);
        $this->assertNull(Role::firstWhere('name', $this->testRole->name));
    }

    /**
     * Test role creation with incomplete permissions spec
     */
    public function test_role_create_non_existing_permission()
    {
        $this->testRole->permissions['rooms'] = ['show'];
        $this->expectException(RecordsNotFoundException::class);
        $this->expectExceptionMessage("Could not find permission with name 'rooms.show'");
        $this->svc->role->create($this->testRole);
        $this->assertNull(Role::firstWhere('name', $this->testRole->name));
    }

    /**
     * Test deletion of all roles
     */
    public function test_role_delete_all()
    {
        $this->assertEquals(2, count(Role::all()));
        $this->svc->role->destroy();
        $this->assertEquals(0, count(Role::all()));
    }

    /**
     * Test deletion of specified role
     */
    public function test_role_delete_named()
    {
        $this->assertEquals(2, count(Role::all()));
        $this->svc->role->destroy(['name' => 'User']);
        $this->assertEquals(1, count(Role::all()));
        $this->assertNull(Role::firstWhere('name', 'User'));
        $this->assertNotNull(Role::firstWhere('name', 'Superuser'));
    }

    /**
     * Test user creation
     */
    public function test_user_create()
    {
        $this->svc->user->create($this->testUser);
        $user = User::where('firstname', $this->testUser->firstname)->where('lastname', $this->testUser->lastname)->first();
        $this->assertEquals($this->testUser->email, $user->email);
        $this->assertTrue(str_starts_with($user->password, '$2y$04$'));
        $this->assertEquals($this->testUser->authenticator, $user->authenticator);
        $this->assertEquals($this->testUser->locale, $user->locale);
        $this->assertEquals($this->testUser->timezone, $user->timezone);
        $this->assertEquals($this->testUser->roles, array_map(fn ($it) => $it->name, $user->roles->all()));
    }

    /**
     * Test user creation with incomplete permissions spec
     */
    public function test_user_create_incomplete()
    {
        unset($this->testUser->password);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid user definition');
        $this->svc->user->create($this->testUser);
        $this->assertNull(User::where('firstname', $this->testUser->firstname)->where('lastname', $this->testUser->lastname)->first());
    }

    /**
     * Test user creation with a non-existing role
     */
    public function test_user_create_non_existing_role()
    {
        $this->testUser->roles = ['fnord'];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid user definition');
        $this->svc->user->create($this->testUser);
        $this->assertNull(User::where('firstname', $this->testUser->firstname)->where('lastname', $this->testUser->lastname)->first());
    }

    /**
     * Test user creation with a duplicate role
     */
    public function test_user_create_duplicate_role()
    {
        $this->testUser->roles = ['User', 'User'];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid user definition');
        $this->svc->user->create($this->testUser);
        $this->assertNull(User::where('firstname', $this->testUser->firstname)->where('lastname', $this->testUser->lastname)->first());
    }

    /**
     * Test deletion of all users
     */
    public function test_user_delete_all()
    {
        $this->assertEquals(3, count(User::all()));
        $this->svc->user->destroy();
        $this->assertEquals(0, count(User::all()));
    }

    /**
     * Test deletion of specified user
     */
    public function test_user_delete_named()
    {
        $this->assertEquals(3, count(User::all()));
        $this->svc->user->destroy([
            'firstname' => "{$this->testUser->firstname} 2", 'lastname' => $this->testUser->lastname,
        ]);
        $this->assertEquals(2, count(User::all()));
        $this->assertNull(
            User::where('firstname', "{$this->testUser->firstname} 2")
                ->where('lastname', $this->testUser->lastname)->first()
        );
        $this->assertNotNull(
            User::where('firstname', "{$this->testUser->firstname} 1")
                ->where('lastname', $this->testUser->lastname)->first()
        );
        $this->assertNotNull(
            User::where('firstname', "{$this->testUser->firstname} 3")
                ->where('lastname', $this->testUser->lastname)->first()
        );
    }

    /**
     * Test modifying application settings
     */
    public function test_settings()
    {
        $this->svc->settings->set($this->testSettings);
        $this->assertEquals($this->testSettings->general['name'], app(GeneralSettings::class)->name);
    }

    /**
     * Test modifying application settings
     */
    public function test_settings_invalid_setting()
    {
        $this->testSettings->general['fnord'] = 'fnord';
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid settings definition');
        $this->svc->settings->set($this->testSettings);
    }

    /**
     * Test modifying application settings
     */
    public function test_settings_invalid_time_period()
    {
        $this->testSettings->recording['recording_retention_period'] = '42';
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid settings definition');
        $this->svc->settings->set($this->testSettings);
    }
}
