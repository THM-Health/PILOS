<?php

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\Recording;
use App\Settings\RecordingSettings;
use Illuminate\Console\Command;
use Log;

class CleanupRecordingsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:recordings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove recordings after retention period';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $retentionPeriod = app(RecordingSettings::class)->recording_retention_period;

        // Remove all recordings older than the retention period
        if ($retentionPeriod != TimePeriod::UNLIMITED) {
            $day = now()->subDays($retentionPeriod->value)->toDateString();
            Log::info('Removing recordings data older than '.$day);
            Recording::where('start', '<', $day)->get()->each(function ($recording) {
                $recording->delete();
            });
        }
    }
}
