<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
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
        ResetPassword::createUrlUsing(function ($notifiable, $token) {
            return url('/reset_password?') . \Arr::query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset()
            ]);
        });
    }
}
