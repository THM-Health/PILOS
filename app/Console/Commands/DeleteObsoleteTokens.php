<?php

namespace App\Console\Commands;

use App\RoomToken;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class DeleteObsoleteTokens extends Command
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
        if (setting('room_token_expiration') > -1) {
            RoomToken::destroy(RoomToken::where(function ($query) {
                $query->whereNull('last_usage')
                        ->where('created_at', '<', Carbon::now()->subMinutes(setting('room_token_expiration')));
            })
                ->orWhere(function ($query) {
                    $query->whereNotNull('last_usage')
                        ->where('last_usage', '<', Carbon::now()->subMinutes(setting('room_token_expiration')));
                })
                ->pluck('token'));
        }

        return 0;
    }
}
