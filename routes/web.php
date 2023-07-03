<?php

use App\Auth\OIDC\OIDCController;
use App\Auth\SAML2\Saml2Controller;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\LocaleController;
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

Route::get('test', function () {
    dd(__('app.actions'));
});

Route::get('download/file/{roomFile}/{filename?}', [FileController::class,'show'])->name('download.file')->middleware('signed');
Route::get('download/attendance/{meeting}', [MeetingController::class,'attendance'])->name('download.attendance')->middleware('auth:users,ldap');

if (config('services.saml2.enabled')) {
    Route::get('auth/saml2/redirect', [Saml2Controller::class,'redirect'])->name('auth.saml2.redirect');
    Route::match(['get', 'post'], 'auth/saml2/callback', [Saml2Controller::class,'callback'])->name('auth.saml2.callback');
    Route::get('/auth/saml2/metadata', [Saml2Controller::class,'metadata'])->name('auth.saml2.metadata');
    Route::match(['get', 'post'],'auth/saml2/logout', [Saml2Controller::class, 'logout'])->name('auth.saml2.logout');
}

if (config('services.oidc.enabled')) {
    Route::get('auth/oidc/redirect', [OIDCController::class, 'redirect'])->name('auth.oidc.redirect');
    Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('auth.oidc.callback');
    Route::match(['get', 'post'],'auth/oidc/logout', [OIDCController::class, 'logout'])->name('auth.oidc.logout');
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
