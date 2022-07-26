<?php

namespace App\Services;

use App\Enums\ServerStatus;
use App\Models\Server;
use App\Models\ServerPool;

class LoadBalancingService
{
    private $servers;
    private int $participantWeight = 1;
    private int $audioWeight       = 2;
    private int $videoWeight       = 3;

    public function __construct()
    {
    }

    public function setServerPool(ServerPool $serverPool)
    {
        $this->servers = $serverPool->servers;

        return $this;
    }

    /**
     * Find server in the pool with the lowest usage
     * @return Server|null
     */
    public function getLowestUsage(): ?Server
    {
        return $this->servers
            ->where('status', ServerStatus::ONLINE)
            ->sortBy(function (Server $server) {
                // Experimental
                // Have video factor 3, audio factor 2 and just listening factor 1
                $videoLoad       =  $server->video_count * $this->videoWeight;
                $voiceLoad       =  $server->voice_participant_count * $this->audioWeight;
                $participantLoad = ($server->participant_count - $server->voice_participant_count) * $this->participantWeight;
                $totalLoad       = $videoLoad + $voiceLoad + $participantLoad;

                return $totalLoad / $server->strength;
            })
            ->first();
    }
}
