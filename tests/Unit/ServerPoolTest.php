<?php

namespace Tests\Unit;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;
use App\Services\LoadBalancingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServerPoolTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test load balancing
     */
    public function testLoadBalancing()
    {
        $offline     = Server::factory()->create(['status'=>ServerStatus::OFFLINE]);
        $disabled    = Server::factory()->create(['status'=>ServerStatus::DISABLED]);
        $lightUsage  = Server::factory()->create(['video_count'=>5,'participant_count'=>20,'voice_participant_count'=>10,'strength'=>1]);
        $heavyUsage  = Server::factory()->create(['video_count'=>20,'participant_count'=>100,'voice_participant_count'=>50,'strength'=>1]);

        $serverPool = ServerPool::factory()->create();
        $serverPool->servers()->sync([$disabled->id,$offline->id,$lightUsage->id,$heavyUsage->id]);
        $loadBalancingService = new LoadBalancingService();
        $loadBalancingService->setServerPool($serverPool);

        // Check basic load balancing
        $serverPool->refresh();
        $server = $loadBalancingService->getLowestUsage();
        $this->assertEquals($lightUsage->id, $server->id);

        // Check with different server strengths
        $heavyUsage->strength=10;
        $heavyUsage->save();
        $serverPool->refresh();
        $loadBalancingService->setServerPool($serverPool);
        $server = $loadBalancingService->getLowestUsage();
        $this->assertEquals($heavyUsage->id, $server->id);

        // Check offline and disabled servers
        $serverPool->servers()->sync([$disabled->id,$offline->id]);
        $serverPool->refresh();
        $loadBalancingService->setServerPool($serverPool);
        $server = $loadBalancingService->getLowestUsage();
        $this->assertNull($server);
    }
}
