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
        $this->testServer = (object) [
            'name' => 'Testserver',
            'description' => 'a fancy description',
            'endpoint' => 'https://bbb.testdoma.in',
            'secret' => 'Xuper$3cr37',
            'strength' => 5,
            'status' => 'enabled',
        ];
    }

    /**
     * Test server creation
     */
    public function test_server_create()
    {
        $svc = new ProvisioningService;
        $svc->server->create($this->testServer);
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
        $svc = new ProvisioningService;
        $this->testServer->status = 'fnord';
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server status');
        $svc->server->create($this->testServer);
    }

    /**
     * Test server creation with invalid strength
     */
    public function test_server_create_invalid_strength()
    {
        $svc = new ProvisioningService;
        $this->testServer->strength = 42;
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server definition');
        $svc->server->create($this->testServer);
    }

    /**
     * Test server creation with incomplete properties
     */
    public function test_server_create_incomplete()
    {
        $svc = new ProvisioningService;
        unset($this->testServer->secret);
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server definition');
        $svc->server->create($this->testServer);
    }
}
