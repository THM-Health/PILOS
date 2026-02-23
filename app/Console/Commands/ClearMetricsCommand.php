<?php

namespace App\Console\Commands;

use App\Prometheus\CollectorRegistry;
use Illuminate\Console\Command;

class ClearMetricsCommand extends Command
{
    protected $signature = 'metrics:clear';

    protected $description = 'Clear metric data';

    /**
     * Execute the console command.
     */
    public function handle(CollectorRegistry $registry): int
    {
        $registry->wipeStorage();
        $this->info('Metrics cleared successfully.');

        return static::SUCCESS;
    }
}
