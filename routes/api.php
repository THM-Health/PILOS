<?php

use App\Http\Controllers\api\v1\ApplicationController;
use App\Http\Controllers\api\v1\auth\ForgotPasswordController;
use App\Http\Controllers\api\v1\auth\LoginController;
use App\Http\Controllers\api\v1\auth\ResetPasswordController;
use App\Http\Controllers\api\v1\MeetingController;
use App\Http\Controllers\api\v1\PermissionController;
use App\Http\Controllers\api\v1\RoleController;
use App\Http\Controllers\api\v1\RoomController;
use App\Http\Controllers\api\v1\RoomFileController;
use App\Http\Controllers\api\v1\RoomMemberController;
use App\Http\Controllers\api\v1\RoomTypeController;
use App\Http\Controllers\api\v1\ServerController;
use App\Http\Controllers\api\v1\ServerPoolController;
use App\Http\Controllers\api\v1\UserController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('settings', [ApplicationController::class,'settings'])->name('application');
    Route::get('currentUser', [ApplicationController::class,'currentUser'])->name('currentUser');
    Route::post('setLocale', function (Request $request) {
        $validatedData = $request->validate([
            'locale' => ['required', 'string', Rule::in(config('app.available_locales'))]
        ]);

        session()->put('locale', $validatedData['locale']);

        if (Auth::user() !== null) {
            Auth::user()->update([
                'locale' => $validatedData['locale']
            ]);
        }
    })->name('setLocale');

    Route::post('login', [LoginController::class,'usersLogin'])->name('login');
    Route::post('login/ldap', [LoginController::class,'ldapLogin'])->name('ldapLogin');
    Route::post('logout', [LoginController::class,'logout'])->name('logout');
    Route::post('password/reset', [ResetPasswordController::class,'reset'])->name('password.reset')->middleware(['guest', 'throttle:password_reset']);

    // TODO: Implement or remove this completely
    // Route::post('register', 'RegisterController@register');
    // Route::post('email/resend', 'VerificationController@resend');
    // Route::get('email/verify/{id}/{hash}', 'VerificationController@verify');

    Route::post('password/email', [ForgotPasswordController::class,'sendResetLinkEmail'])->name('password.email')->middleware(['enable_if:password_self_reset_enabled', 'guest', 'throttle:password_email']);

    Route::middleware('auth:users,ldap')->group(function () {
        Route::get('settings/all', [ApplicationController::class,'allSettings'])->name('application.complete')->middleware('can:applicationSettings.viewAny');
        Route::put('settings', [ApplicationController::class,'updateSettings'])->name('application.update')->middleware('can:applicationSettings.update');

        Route::apiResource('roles', RoleController::class);
        Route::apiResource('roomTypes', RoomTypeController::class);

        Route::get('permissions', [PermissionController::class,'index'])->name('permissions.index');

        Route::get('rooms', [RoomController::class,'index'])->name('rooms.index');
        Route::post('rooms', [RoomController::class,'store'])->name('rooms.store');
        Route::put('rooms/{room}', [RoomController::class,'update'])->name('rooms.update');
        Route::delete('rooms/{room}', [RoomController::class,'destroy'])->name('rooms.destroy');

        Route::get('rooms/{room}/settings', [RoomController::class,'getSettings'])->name('rooms.settings');

        // Membership user self add/remove
        Route::post('rooms/{room}/membership', [RoomMemberController::class,'join'])->name('rooms.membership.join');
        Route::delete('rooms/{room}/membership', [RoomMemberController::class,'leave'])->name('rooms.membership.leave');
        // Membership operations by room owner
        Route::get('rooms/{room}/member', [RoomMemberController::class,'index'])->name('rooms.member.get')->middleware('can:viewMembers,room');
        Route::post('rooms/{room}/member', [RoomMemberController::class,'store'])->name('rooms.member.add')->middleware('can:manageMembers,room');
        Route::put('rooms/{room}/member/{user}', [RoomMemberController::class,'update'])->name('rooms.member.update')->middleware('can:manageMembers,room');
        Route::delete('rooms/{room}/member/{user}', [RoomMemberController::class,'destroy'])->name('rooms.member.remove')->middleware('can:manageMembers,room');
        // File operations
        Route::middleware('can:manageFiles,room')->group(function () {
            Route::post('rooms/{room}/files', [RoomFileController::class,'store'])->name('rooms.files.add');

            Route::put('rooms/{room}/files/{file}', [RoomFileController::class,'update'])->name('rooms.files.update');
            Route::delete('rooms/{room}/files/{file}', [RoomFileController::class,'destroy'])->name('rooms.files.remove');
        });

        Route::get('users/search', [UserController::class,'search'])->name('users.search');
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/resetPassword', [UserController::class,'resetPassword'])->name('users.password.reset')->middleware('can:resetPassword,user');

        Route::post('servers/check', [ServerController::class,'check'])->name('servers.check')->middleware('can:viewAny,App\Server');
        Route::get('servers/{server}/panic', [ServerController::class,'panic'])->name('servers.panic')->middleware('can:update,server');
        Route::apiResource('servers', ServerController::class);
        Route::apiResource('serverPools', ServerPoolController::class);


        Route::get('meetings/{meeting}/attendance', [MeetingController::class,'attendance'])->name('meetings.attendance');
        Route::get('meetings/{meeting}/stats', [MeetingController::class,'stats'])->name('meetings.stats');
        Route::get('meetings', [MeetingController::class,'index'])->name('meetings.index');
        Route::get('rooms/{room}/meetings', [RoomController::class,'meetings'])->name('rooms.meetings');

        Route::get('getTimezones', function () {
            return response()->json([ 'timezones' => timezone_identifiers_list() ]);
        });
    });

    Route::middleware('can:view,room')->group(function () {
        Route::get('rooms/{room}', [RoomController::class,'show'])->name('rooms.show')->middleware('room.authenticate:true');
        Route::get('rooms/{room}/start', [RoomController::class,'start'])->name('rooms.start')->middleware('room.authenticate');
        Route::get('rooms/{room}/join', [RoomController::class,'join'])->name('rooms.join')->middleware('room.authenticate');
        Route::get('rooms/{room}/files', [RoomFileController::class,'index'])->name('rooms.files.get')->middleware('room.authenticate');
        Route::get('rooms/{room}/files/{file}', [RoomFileController::class,'show'])->name('rooms.files.show')->middleware(['can:downloadFile,room,file', 'room.authenticate']);
    });

    Route::get('meetings/{meeting}/endCallback', [MeetingController::class,'endMeetingCallback'])->name('meetings.endcallback');
});

if (!env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', function () {
        return response()->json([ 'message' => 'Not found!' ], 404);
    })->where('any', '.*');
}
