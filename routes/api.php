<?php

use App\Auth\LDAP\LDAPController;
use App\Http\Controllers\api\v1\ApplicationController;
use App\Http\Controllers\api\v1\auth\ForgotPasswordController;
use App\Http\Controllers\api\v1\auth\LoginController;
use App\Http\Controllers\api\v1\auth\ResetPasswordController;
use App\Http\Controllers\api\v1\auth\VerificationController;
use App\Http\Controllers\api\v1\LocaleController;
use App\Http\Controllers\api\v1\MeetingController;
use App\Http\Controllers\api\v1\PermissionController;
use App\Http\Controllers\api\v1\RecordingController;
use App\Http\Controllers\api\v1\RecordingFormatController;
use App\Http\Controllers\api\v1\RoleController;
use App\Http\Controllers\api\v1\RoomController;
use App\Http\Controllers\api\v1\RoomFileController;
use App\Http\Controllers\api\v1\RoomMemberController;
use App\Http\Controllers\api\v1\RoomStreamingController;
use App\Http\Controllers\api\v1\RoomTokenController;
use App\Http\Controllers\api\v1\RoomTypeController;
use App\Http\Controllers\api\v1\RoomTypeStreamingController;
use App\Http\Controllers\api\v1\ServerController;
use App\Http\Controllers\api\v1\ServerPoolController;
use App\Http\Controllers\api\v1\SessionController;
use App\Http\Controllers\api\v1\SettingsController;
use App\Http\Controllers\api\v1\StreamingController;
use App\Http\Controllers\api\v1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('locale/{locale}', [LocaleController::class, 'show'])->name('locale.get');
    Route::post('locale', [LocaleController::class, 'update'])->name('locale.update');

    Route::get('config', [ApplicationController::class, 'config'])->name('config');
    Route::get('currentUser', [ApplicationController::class, 'currentUser'])->name('currentUser');

    Route::post('login/local', [LoginController::class, 'login'])->name('login.local')->middleware(['enable_if_config:auth.local.enabled']);
    Route::post('login/ldap', [LDAPController::class, 'login'])->name('login.ldap')->middleware(['enable_if_config:ldap.enabled']);

    Route::post('logout', [LoginController::class, 'logout'])->name('logout');
    Route::post('password/reset', [ResetPasswordController::class, 'reset'])->name('password.reset')->middleware(['enable_if_config:auth.local.enabled', 'guest', 'throttle:password_reset']);

    // TODO: Implement or remove this completely
    // Route::post('register', 'RegisterController@register');

    Route::post('password/email', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email')->middleware(['enable_if_config:auth.local.enabled', 'guest', 'throttle:password_email']);

    Route::middleware('auth:users,ldap')->group(function () {
        Route::get('settings', [SettingsController::class, 'view'])->name('settings.view')->middleware('can:settings.viewAny');
        Route::put('settings', [SettingsController::class, 'update'])->name('settings.update')->middleware('can:settings.update');

        Route::apiResource('roles', RoleController::class);
        Route::apiResource('roomTypes', RoomTypeController::class);

        Route::get('streaming', [StreamingController::class, 'view'])->name('streaming.view')->middleware(['enable_if_config:streaming.enabled', 'can:streaming.viewAny']);
        Route::put('streaming', [StreamingController::class, 'update'])->name('streaming.update')->middleware(['enable_if_config:streaming.enabled', 'can:streaming.update']);

        Route::get('roomTypes/{roomType}/streaming', [RoomTypeStreamingController::class, 'view'])->name('roomTypes.streaming.view')->middleware(['enable_if_config:streaming.enabled', 'can:streaming.viewAny']);
        Route::put('roomTypes/{roomType}/streaming', [RoomTypeStreamingController::class, 'update'])->name('roomTypes.streaming.update')->middleware(['enable_if_config:streaming.enabled', 'can:streaming.update']);

        Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');

        Route::get('rooms', [RoomController::class, 'index'])->name('rooms.index');
        Route::post('rooms', [RoomController::class, 'store'])->name('rooms.store');
        Route::post('rooms/{room}/favorites', [RoomController::class, 'addToFavorites'])->name('rooms.favorites.add');
        Route::delete('rooms/{room}/favorites', [RoomController::class, 'deleteFromFavorites'])->name('rooms.favorites.delete');
        Route::put('rooms/{room}', [RoomController::class, 'update'])->name('rooms.update');
        Route::delete('rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy');

        Route::get('rooms/{room}/settings', [RoomController::class, 'getSettings'])->name('rooms.settings');

        Route::put('rooms/{room}/description', [RoomController::class, 'updateDescription'])->name('rooms.description.update')->middleware('can:update,room');

        Route::post('rooms/{room}/transfer', [RoomController::class, 'transferOwnership'])->name('rooms.transfer')->middleware('can:transfer,room');

        // Membership user self add/remove
        Route::post('rooms/{room}/membership', [RoomMemberController::class, 'join'])->name('rooms.membership.join');
        Route::delete('rooms/{room}/membership', [RoomMemberController::class, 'leave'])->name('rooms.membership.leave');

        // Membership users for mass update & delete
        Route::post('rooms/{room}/member/bulk', [RoomMemberController::class, 'bulkImport'])->name('rooms.member.bulkImport')->middleware('can:manageMembers,room');
        Route::put('rooms/{room}/member/bulk', [RoomMemberController::class, 'bulkUpdate'])->name('rooms.member.bulkUpdate')->middleware('can:manageMembers,room');
        Route::delete('rooms/{room}/member/bulk', [RoomMemberController::class, 'bulkDestroy'])->name('rooms.member.bulkDestroy')->middleware('can:manageMembers,room');

        // Membership operations by room owner
        Route::get('rooms/{room}/member', [RoomMemberController::class, 'index'])->name('rooms.member.get')->middleware('can:viewMembers,room');
        Route::post('rooms/{room}/member', [RoomMemberController::class, 'store'])->name('rooms.member.add')->middleware('can:manageMembers,room');
        Route::put('rooms/{room}/member/{user}', [RoomMemberController::class, 'update'])->name('rooms.member.update')->middleware('can:manageMembers,room');
        Route::delete('rooms/{room}/member/{user}', [RoomMemberController::class, 'destroy'])->name('rooms.member.destroy')->middleware('can:manageMembers,room');

        // Recording operations
        Route::middleware('can:manageRecordings,room')->scopeBindings()->group(function () {
            Route::put('rooms/{room}/recordings/{recording}', [RecordingController::class, 'update'])->name('rooms.recordings.update');
            Route::delete('rooms/{room}/recordings/{recording}', [RecordingController::class, 'destroy'])->name('rooms.recordings.destroy');
        });

        // Streaming operations
        Route::middleware('can:viewStreaming,room')->scopeBindings()->group(function () {
            Route::get('rooms/{room}/streaming/config', [RoomStreamingController::class, 'getConfig'])->name('rooms.streaming.config.get');
            Route::get('rooms/{room}/streaming/status', [RoomStreamingController::class, 'status'])->name('rooms.streaming.status');
        });

        Route::middleware('can:manageStreaming,room')->scopeBindings()->group(function () {
            Route::put('rooms/{room}/streaming/config', [RoomStreamingController::class, 'updateConfig'])->name('rooms.streaming.config.update');
            Route::post('rooms/{room}/streaming/start', [RoomStreamingController::class, 'start'])->name('rooms.streaming.start');
            Route::post('rooms/{room}/streaming/stop', [RoomStreamingController::class, 'stop'])->name('rooms.streaming.stop');
            Route::post('rooms/{room}/streaming/pause', [RoomStreamingController::class, 'pause'])->name('rooms.streaming.pause');
            Route::post('rooms/{room}/streaming/resume', [RoomStreamingController::class, 'resume'])->name('rooms.streaming.resume');
        });

        // Personalized room tokens
        Route::get('rooms/{room}/tokens', [RoomTokenController::class, 'index'])->name('rooms.tokens.get')->middleware('can:viewTokens,room');
        Route::post('rooms/{room}/tokens', [RoomTokenController::class, 'store'])->name('rooms.tokens.add')->middleware('can:manageTokens,room');
        Route::put('rooms/{room}/tokens/{token}', [RoomTokenController::class, 'update'])->name('rooms.tokens.update')->middleware('can:manageTokens,room');
        Route::delete('rooms/{room}/tokens/{token}', [RoomTokenController::class, 'destroy'])->name('rooms.tokens.destroy')->middleware('can:manageTokens,room');

        // File operations
        Route::middleware('can:manageFiles,room')->scopeBindings()->group(function () {
            Route::post('rooms/{room}/files', [RoomFileController::class, 'store'])->name('rooms.files.add');
            Route::put('rooms/{room}/files/{file}', [RoomFileController::class, 'update'])->name('rooms.files.update');
            Route::delete('rooms/{room}/files/{file}', [RoomFileController::class, 'destroy'])->name('rooms.files.destroy');
        });

        Route::get('users/search', [UserController::class, 'search'])->name('users.search');
        Route::apiResource('users', UserController::class);

        // User profile changes
        // If editing own profile current password is required, this middleware should prevent brute forcing of the current password
        Route::middleware('throttle:current_password')->group(function () {
            Route::put('users/{user}/email', [UserController::class, 'changeEmail'])->name('users.email.change')->middleware('can:updateAttributes,user');
            Route::put('users/{user}/password', [UserController::class, 'changePassword'])->name('users.password.change')->middleware('can:changePassword,user');
        });
        Route::post('email/verify', [VerificationController::class, 'verify'])->name('email.verify')->middleware('throttle:verify_email');

        Route::post('users/{user}/resetPassword', [UserController::class, 'resetPassword'])->name('users.password.reset')->middleware(['enable_if_config:auth.local.enabled', 'can:resetPassword,user']);

        Route::get('sessions', [SessionController::class, 'index'])->name('sessions.index');
        Route::delete('sessions', [SessionController::class, 'destroy'])->name('sessions.destroy');

        Route::post('servers/check', [ServerController::class, 'check'])->name('servers.check')->middleware('can:viewAny,App\Models\Server');
        Route::get('servers/{server}/panic', [ServerController::class, 'panic'])->name('servers.panic')->middleware('can:update,server');
        Route::apiResource('servers', ServerController::class);
        Route::apiResource('serverPools', ServerPoolController::class);

        Route::get('meetings/{meeting}/attendance', [MeetingController::class, 'attendance'])->name('meetings.attendance');
        Route::get('meetings/{meeting}/stats', [MeetingController::class, 'stats'])->name('meetings.stats');
        Route::get('meetings', [MeetingController::class, 'index'])->name('meetings.index');
        Route::get('rooms/{room}/meetings', [RoomController::class, 'meetings'])->name('rooms.meetings');

        Route::get('getTimezones', function () {
            return response()->json(['data' => timezone_identifiers_list()]);
        });
    });

    Route::get('rooms/{room}', [RoomController::class, 'show'])->name('rooms.show')->middleware('room.authenticate:true');

    Route::middleware('room.authenticate')->scopeBindings()->group(function () {
        Route::options('rooms/{room}/start', [RoomController::class, 'getStartRequirements'])->name('rooms.start-requirements')->middleware('can:start,room');
        Route::options('rooms/{room}/join', [RoomController::class, 'getJoinRequirements'])->name('rooms.join-requirements');

        Route::post('rooms/{room}/start', [RoomController::class, 'start'])->name('rooms.start')->middleware('can:start,room');
        Route::post('rooms/{room}/join', [RoomController::class, 'join'])->name('rooms.join');
        Route::get('rooms/{room}/files', [RoomFileController::class, 'index'])->name('rooms.files.get');
        Route::get('rooms/{room}/files/{file}', [RoomFileController::class, 'show'])->name('rooms.files.show')->middleware('can:downloadFile,room,file');
        Route::get('rooms/{room}/recordings', [RecordingController::class, 'index'])->name('rooms.recordings.index');
        Route::get('rooms/{room}/recordings/{recording}/formats/{format}', [RecordingFormatController::class, 'show'])->name('rooms.recordings.formats.show')->middleware('can:viewRecordingFormat,room,format');

    });

    Route::get('meetings/{meeting}/endCallback', [MeetingController::class, 'endMeetingCallback'])->name('meetings.endcallback');
});

if (! env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', function () {
        return response()->json(['message' => 'Not found!'], 404);
    })->where('any', '.*');
}
