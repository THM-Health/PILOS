<?php

use App\Auth\Shibboleth\ShibbolethController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\MeetingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/
Route::get('download/file/{roomFile}/{filename?}', [FileController::class,'show'])->name('download.file')->middleware('signed');
Route::get('download/attendance/{meeting}', [MeetingController::class,'attendance'])->name('download.attendance')->middleware('auth:users,ldap');

if (config('services.shibboleth.enabled')) {
    Route::get('auth/shibboleth/redirect', [ShibbolethController::class,'redirect'])->name('auth.shibboleth.redirect');
    Route::get('auth/shibboleth/callback', [ShibbolethController::class,'callback'])->name('auth.shibboleth.callback');
    Route::match(['get', 'post'],'auth/shibboleth/logout', [ShibbolethController::class, 'logout'])->name('auth.shibboleth.logout');
}

if (config('greenlight.compatibility')) {
    Route::prefix(config('greenlight.base'))->group(function () {
        // room urls
        Route::get('/{id}', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}(-[A-Za-z0-9]{3})?)');
        // login
        Route::redirect('/ldap_signin', '/login');
        Route::redirect('/signin', '/login');
        // default room
        Route::redirect('/default_room', '/rooms/own');
        // all other routes
        Route::redirect('/', '/');
        Route::redirect('/{any}', '/')->where('any', '.*');
    });
}

if (!env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', [ApplicationController::class,'index'])->where('any', '.*');
}
