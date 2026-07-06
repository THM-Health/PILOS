<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use App\Auth\OIDC\OIDCController;
use App\Auth\Shibboleth\ShibbolethController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\RecordingController;
use App\Http\Controllers\RecordingFormatController;
use App\Http\Controllers\RoomFileController;
use Illuminate\Support\Facades\Route;
use Spatie\Csp\AddCspHeaders;

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
Route::get('download/file/{roomFile}/{filename?}', [RoomFileController::class, 'showPresentation'])->name('rooms.files.download.bbb')->middleware('signed');
Route::get('room/{room}/file/{file}/{filename?}', [RoomFileController::class, 'show'])->name('rooms.files.download')->middleware(['signed:room_auth_token,room_auth_token_type', 'room.authenticate', 'throttle:room-enumeration'])->scopeBindings();
Route::get('download/attendance/{meeting}', [MeetingController::class, 'attendance'])->name('download.attendance')->middleware('auth:users,ldap');
Route::get('download/recording/{recording}', [RecordingController::class, 'download'])->middleware('auth:users,ldap')->name('recording.download');

Route::get('rooms/{room}/recordings/{recording}/formats/{format}', [RecordingFormatController::class, 'show'])->name('rooms.recordings.formats.show')->middleware('room.authenticate', 'throttle:room-enumeration')->scopeBindings();

Route::get('recording/{formatName}/{recording}/{resource?}', [RecordingController::class, 'resource'])->where('resource', '.*')->name('recording.resource');
// Do not change this url! Needs to be in this format to be compatible with the BBB recording player
Route::get('presentation/{recording}/{resource}', [RecordingController::class, 'presentationResource'])->where('resource', '.*')->name('recording.presentation');

Route::middleware('enable_if_config:services.shibboleth.enabled')->group(function () {
    Route::get('auth/shibboleth/redirect', [ShibbolethController::class, 'redirect'])->name('auth.shibboleth.redirect');
    Route::get('auth/shibboleth/callback', [ShibbolethController::class, 'callback'])->name('auth.shibboleth.callback');
    Route::match(['get', 'post'], 'auth/shibboleth/logout', [ShibbolethController::class, 'logout'])->name('auth.shibboleth.logout');
});

Route::middleware('enable_if_config:services.oidc.enabled')->group(function () {
    Route::get('auth/oidc/redirect', [OIDCController::class, 'redirect'])->name('auth.oidc.redirect');
    Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('auth.oidc.callback');
    Route::post('auth/oidc/logout', [OIDCController::class, 'logout'])->name('auth.oidc.logout');
});

if (config('greenlight.compatibility')) {
    Route::prefix(config('greenlight.base'))->group(function () {
        // Greenlight v2 room urls
        Route::get('/{id}', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9-]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}(-[A-Za-z0-9]{3})?)');

        // Greenlight v3 room urls (only used if GL 3 was running in a subdirectory, otherwise frontend routing will handle this)
        Route::get('/rooms/{id}', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9-]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}(-[A-Za-z0-9]{3})?)');
        Route::get('/rooms/{id}/join', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9-]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}(-[A-Za-z0-9]{3})?)');

        // login
        Route::redirect('/ldap_signin', '/login');
        Route::redirect('/signin', '/login');
        // default room
        Route::redirect('/default_room', '/rooms');
        // all other routes
        Route::redirect('/', '/');
        Route::redirect('/{any}', '/')->where('any', '.*');
    });
}

Route::get('metrics', MetricsController::class)
    ->middleware(['enable_if_config:metrics.enabled'])
    ->withoutMiddleware('web');

if (! env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', [ApplicationController::class, 'index'])->where('any', '.*')->middleware(AddCspHeaders::class);
}
