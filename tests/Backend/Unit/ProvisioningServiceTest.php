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

    /**
     * Test server creation
     */
    public function test_server_create()
    {
        $svc = new ProvisioningService;
        $name = 'foo';
        $endpoint = 'https://bbb.foo.biz';
        $secret = 'Xuper$3cr37';
        $properties = [
            'name' => $name,
            'description' => 'a fancy description',
            'endpoint' => $endpoint,
            'secret' => $secret,
            'strength' => 5,
            'status' => 'enabled',
        ];
        $svc->server->create((object) $properties);
        $server = Server::firstWhere('name', $name);
        $this->assertNotNull($server);
        $this->assertEquals($endpoint, $server->base_url);
        $this->assertEquals($secret, $server->secret);
        $this->assertEquals(ServerStatus::ENABLED, $server->status);
    }

    /**
     * Test server creation with invalid server status
     */
    public function test_server_create_invalid_status()
    {
        $svc = new ProvisioningService;
        $name = 'foo';
        $endpoint = 'https://bbb.foo.biz';
        $secret = 'Xuper$3cr37';
        $properties = [
            'name' => $name,
            'description' => 'a fancy description',
            'endpoint' => $endpoint,
            'secret' => $secret,
            'strength' => 5,
            'status' => 'fnord',
        ];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid server status');
        $svc->server->create((object) $properties);
    }

    /**
     * Test server creation with invalid strength
     */
    public function test_server_create_invalid_strength()
    {
        $svc = new ProvisioningService;
        $name = 'foo';
        $endpoint = 'https://bbb.foo.biz';
        $secret = 'Xuper$3cr37';
        $properties = [
            'name' => $name,
            'description' => 'a fancy description',
            'endpoint' => $endpoint,
            'secret' => $secret,
            'strength' => 'fnord',
            'status' => 'disabled',
        ];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Server strength must be a number');
        $svc->server->create((object) $properties);
    }

    /**
     * Test server creation with incomplete properties
     */
    public function test_server_create_incomplete()
    {
        $svc = new ProvisioningService;
        $properties = [
            'name' => 'foo',
            'description' => 'a fancy description',
            'strength' => 42,
            'status' => 'disabled',
        ];
        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Incomplete server definition');
        $svc->server->create((object) $properties);
    }
}
