<?php

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\RoomToken;
use App\Settings\RoomSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Log;

class DeleteObsoleteTokensCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'room:tokens:delete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes all personalized room tokens that are expired.';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $expireDuration = app(RoomSettings::class)->token_expiration;

        if ($expireDuration != TimePeriod::UNLIMITED) {
            $expiredTokens = RoomToken::where(function ($query) use ($expireDuration) {
                $query->whereNull('last_usage')
                    ->where('created_at', '<', Carbon::now()->subDays($expireDuration->value));
            })
                ->orWhere(function ($query) use ($expireDuration) {
                    $query->whereNotNull('last_usage')
                        ->where('last_usage', '<', Carbon::now()->subDays($expireDuration->value));
                })
                ->pluck('token');

            Log::info('Deleting '.count($expiredTokens).' expired room tokens');

            RoomToken::destroy($expiredTokens);
        }

        return 0;
    }
}
