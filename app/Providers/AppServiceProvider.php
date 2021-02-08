<?php

namespace App\Providers;

use App\Notifications\PasswordReset;
use App\Notifications\UserWelcome;
use Carbon\Carbon;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);
        ResetPassword::toMailUsing(function ($notifiable, $token) {
            $token = DB::table('password_resets')
                ->where('token', '=', $token)
                ->where('email', '=', $notifiable->email)
                ->first();

            return $notifiable->notify(new PasswordReset($token, Carbon::parse($token->created_at)->locale($notifiable->locale)));
        });
    }
}
