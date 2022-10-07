<?php

namespace App\Console\Commands;

use App\Models\Server;
use App\Services\ServerService;
use Illuminate\Console\Command;

class BuildHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'history:build';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check server status and capture usage data for live data and statistics';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $servers = Server::all();
        foreach ($servers as $server) {
            $serverService = new ServerService($server);
            $serverService->updateUsage();
        }
    }
}
