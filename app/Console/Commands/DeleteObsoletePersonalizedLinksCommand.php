<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\RoomPersonalizedLink;
use App\Settings\RoomSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class DeleteObsoletePersonalizedLinksCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'room:personal-links:delete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes all personalized room links that are expired.';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $expireDuration = app(RoomSettings::class)->personalized_link_expiration;

        if ($expireDuration != TimePeriod::UNLIMITED) {
            $expiredLinks = RoomPersonalizedLink::query()
                ->where(function ($query) use ($expireDuration) {
                    $query->whereNull('last_usage')
                        ->where('created_at', '<', Carbon::now()->subDays($expireDuration->value));
                })
                ->orWhere(function ($query) use ($expireDuration) {
                    $query->whereNotNull('last_usage')
                        ->where('last_usage', '<', Carbon::now()->subDays($expireDuration->value));
                })
                ->pluck('id');

            Log::info('Deleting '.count($expiredLinks).' expired personalized room links');

            RoomPersonalizedLink::destroy($expiredLinks);
        }

        return 0;
    }
}
