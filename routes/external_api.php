<?php

declare(strict_types=1);

use App\Http\Controllers\external\v1\CurrentTokenController;
use App\Http\Controllers\external\v1\RoomController;
use App\Http\Controllers\external\v1\RoomTypeController;
use Illuminate\Support\Facades\Route;
use Laravel\Passport\Http\Middleware\CheckToken;
use Laravel\Passport\Http\Middleware\CheckTokenForAnyScope;

Route::get('/', function () {
    return response()->json([
        'version' => '1',
        'enabled' => config('passport.enabled'),
    ]);
});

Route::prefix('v1')->name('external_api.v1.')->middleware(['auth:oauth_external', 'enable_if_config:passport.enabled'])->group(function () {
    Route::get('me', [CurrentTokenController::class, 'show'])
        ->name('current-token.show')
        ->middleware(CheckToken::using('user:own:read'));

    Route::get('room_types', [RoomTypeController::class, 'index'])
        ->name('room_types.index')
        ->middleware(CheckTokenForAnyScope::using('room:create', 'room:own:read'));

    Route::get('rooms', [RoomController::class, 'index'])
        ->name('rooms.index')
        ->middleware(CheckToken::using('room:own:read'));

    Route::post('rooms', [RoomController::class, 'store'])
        ->name('rooms.store')
        ->middleware(CheckToken::using('room:create'));
});
