<?php

namespace App\Providers;

use App\Notifications\PasswordReset;
use Carbon\Carbon;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Pagination\Paginator;

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
        Paginator::useBootstrap();
        Schema::defaultStringLength(191);
        ResetPassword::toMailUsing(function ($notifiable, $token) {
            $reset = DB::table('password_resets')
                ->where('email', '=', $notifiable->email)
                ->first();

            return (new PasswordReset($token, Carbon::parse($reset->created_at)))
                ->toMail($notifiable);
        });
    }
}
