<?php

namespace Tests\Unit;

use App\Enums\ServerStatus;
use App\Server;
use App\ServerPool;
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
        $offline     = factory(Server::class)->create(['status'=>ServerStatus::OFFLINE]);
        $disabled    = factory(Server::class)->create(['status'=>ServerStatus::DISABLED]);
        $lightUsage  = factory(Server::class)->create(['video_count'=>5,'participant_count'=>20,'voice_participant_count'=>10,'strength'=>1]);
        $heavyUsage  = factory(Server::class)->create(['video_count'=>20,'participant_count'=>100,'voice_participant_count'=>50,'strength'=>1]);

        $serverPool = factory(ServerPool::class)->create();
        $serverPool->servers()->sync([$disabled->id,$offline->id,$lightUsage->id,$heavyUsage->id]);

        // Check basic load balancing
        $server = $serverPool->lowestUsage();
        $this->assertEquals($lightUsage->id, $server->id);

        // Check with different server strengths
        $heavyUsage->strength=10;
        $heavyUsage->save();
        $server = $serverPool->lowestUsage();
        $this->assertEquals($heavyUsage->id, $server->id);

        // Check offline and disabled servers
        $serverPool->servers()->sync([$disabled->id,$offline->id]);
        $server = $serverPool->lowestUsage();
        $this->assertNull($server);
    }
}
