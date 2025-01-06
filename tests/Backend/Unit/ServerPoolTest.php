<?php

namespace Tests\Backend\Unit;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;
use App\Services\LoadBalancingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class ServerPoolTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test load balancing
     */
    public function test_load_balancing()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        $unhealthy = Server::factory()->create(['status' => ServerStatus::ENABLED]);
        $unhealthy->error_count = 1;
        $unhealthy->save();
        $offline = Server::factory()->create(['status' => ServerStatus::ENABLED]);
        $offline->error_count = 3;
        $offline->save();
        $draining = Server::factory()->create(['status' => ServerStatus::DRAINING]);
        $disabled = Server::factory()->create(['status' => ServerStatus::DISABLED]);
        $lightUsage = Server::factory()->create(['load' => 5, 'strength' => 1]);
        $heavyUsage = Server::factory()->create(['load' => 20, 'strength' => 1]);

        $serverPool = ServerPool::factory()->create();
        $serverPool->servers()->sync([$unhealthy->id, $offline->id, $draining->id, $disabled->id, $offline->id, $lightUsage->id, $heavyUsage->id]);
        $loadBalancingService = new LoadBalancingService;
        $loadBalancingService->setServerPool($serverPool);

        // Check basic load balancing
        $serverPool->refresh();
        $server = $loadBalancingService->getLowestUsageServer();
        $this->assertEquals($lightUsage->id, $server->id);

        // Check with different server strengths
        $heavyUsage->strength = 10;
        $heavyUsage->save();
        $serverPool->refresh();
        $loadBalancingService->setServerPool($serverPool);
        $server = $loadBalancingService->getLowestUsageServer();
        $this->assertEquals($heavyUsage->id, $server->id);

        // Check server that should not be used for load balancing
        $serverPool->servers()->sync([$unhealthy->id, $offline->id, $draining->id, $disabled->id, $offline->id]);
        $serverPool->refresh();
        $loadBalancingService->setServerPool($serverPool);
        $server = $loadBalancingService->getLowestUsageServer();
        $this->assertNull($server);
    }
}
