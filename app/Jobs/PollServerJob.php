<?php

namespace App\Jobs;

use App\Models\Server;
use App\Services\ServerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PollServerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Server $server;

    /**
     * Create a new job instance.
     */
    public function __construct(Server $server)
    {
        $this->server = $server;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $serverService = new ServerService($this->server);

        $updateServerStatistics = setting('statistics.servers.enabled');
        $updateMeetingStatistics = setting('statistics.meetings.enabled');

        $serverService->updateUsage($updateServerStatistics, $updateMeetingStatistics, true);
    }
}
