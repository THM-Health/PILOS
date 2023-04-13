<?php

use App\Auth\OIDC\OIDCController;
use App\Auth\Shibboleth\ShibbolethController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\RecordingController;
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
Route::get('download/file/{roomFile}/{filename?}', [FileController::class, 'show'])->name('download.file')->middleware('signed');
Route::get('download/attendance/{meeting}', [MeetingController::class, 'attendance'])->name('download.attendance')->middleware('auth:users,ldap');
Route::get('download/recording/{recording}', [RecordingController::class, 'download'])->middleware('auth:users,ldap')->name('recording.download');

// Do not change this url format! Needs to be in this format in order to be compatible with the BBB recording player
Route::get('recording/{formatName}/{recording}/{resource?}', [RecordingController::class, 'resource'])->where('resource', '.*')->name('recording.resource');

Route::middleware('enable_if_config:services.shibboleth.enabled')->group(function () {
    Route::get('auth/shibboleth/redirect', [ShibbolethController::class, 'redirect'])->name('auth.shibboleth.redirect');
    Route::get('auth/shibboleth/callback', [ShibbolethController::class, 'callback'])->name('auth.shibboleth.callback');
    Route::match(['get', 'post'], 'auth/shibboleth/logout', [ShibbolethController::class, 'logout'])->name('auth.shibboleth.logout');
});

Route::middleware('enable_if_config:services.oidc.enabled')->group(function () {
    Route::get('auth/oidc/redirect', [OIDCController::class, 'redirect'])->name('auth.oidc.redirect');
    Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('auth.oidc.callback');
    Route::match(['get', 'post'], 'auth/oidc/logout', [OIDCController::class, 'logout'])->name('auth.oidc.logout');
});

if (config('greenlight.compatibility')) {
    Route::prefix(config('greenlight.base'))->group(function () {
        // room urls
        Route::get('/{id}', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9-]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}(-[A-Za-z0-9]{3})?)');
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

if (! env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', [ApplicationController::class, 'index'])->where('any', '.*')->middleware(Spatie\Csp\AddCspHeaders::class);
}
