<?php

namespace Tests\Backend\Unit;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Services\ProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;
use UnexpectedValueException;

class ProvisioningServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
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
            'name' => 'Testserver',
            'description' => 'a fancy description',
            'servers' => ['Test Server'],
        ];
        Server::upsert(
            [
                [
                    'name' => "Existing {$this->testServer->name} 1",
                    'base_url' => $this->testServer->endpoint,
                    'secret' => $this->testServer->secret,
                    'status' => ServerStatus::ENABLED,
                ],
                [
                    'name' => "Existing {$this->testServer->name} 2",
                    'base_url' => $this->testServer->endpoint,
                    'secret' => $this->testServer->secret,
                    'status' => ServerStatus::ENABLED,
                ],
                [
                    'name' => "Existing {$this->testServer->name} 3",
                    'base_url' => $this->testServer->endpoint,
                    'secret' => $this->testServer->secret,
                    'status' => ServerStatus::ENABLED,
                ],
            ],
            uniqueBy: ['name'],
            update: ['base_url', 'secret', 'status'],
        );
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
        $this->expectExceptionMessage('Invalid server status');
        $this->svc->server->create($this->testServer);
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
}
