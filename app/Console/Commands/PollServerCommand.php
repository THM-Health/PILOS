<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\PollServerJob;
use App\Models\Server;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PollServerCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'server:poll';

    protected $aliases = ['history:build'];

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update the server status and capture data for statistics and attendance';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $servers = Server::all();
        Log::info('Building history for servers');
        foreach ($servers as $server) {
            PollServerJob::dispatch($server);
        }
    }
}
