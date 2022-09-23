<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Password;

/**
 * Command class that deletes new users that hasn't changed their
 * generated password in the given time.
 *
 * @package App\Console\Commands
 */
class DeleteUnverifiedNewUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:delete:unverified';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes new users that were created with a random password and the password reset link is expired.';

    /**
     * Deletes all new users with expired password resets.
     *
     * @return int
     */
    public function handle()
    {
        $broker           = Password::broker('new_users');
        $unverified_users = User::join('password_resets', 'password_resets.email', '=', 'users.email')
            ->where('authenticator', '=', 'users')
            ->where('initial_password_set', '=', true)
            ->where('password_resets.created_at', '<', Carbon::now()->subMinutes(config('auth.passwords.new_users.expire')))
            ->get();

        foreach ($unverified_users as $user) {
            $broker->deleteToken($user);
            $user->delete();
        }

        return 0;
    }
}
