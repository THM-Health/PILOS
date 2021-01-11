<?php

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

Route::prefix('v1')->namespace('api\v1')->name('api.v1.')->group(function () {
    Route::get('settings', 'ApplicationController@settings')->name('application');
    Route::get('currentUser', 'ApplicationController@currentUser')->name('currentUser');
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

    Route::namespace('auth')->group(function () {
        Route::post('login', 'LoginController@usersLogin')->name('login');
        Route::post('login/ldap', 'LoginController@ldapLogin')->name('ldapLogin');
        Route::post('logout', 'LoginController@logout')->name('logout');

        // TODO: Implement or remove this completely
//        Route::post('register', 'RegisterController@register');
//        Route::post('password/reset', 'ResetPasswordController@reset');
//        Route::post('password/email', 'ForgotPasswordController@sendResetLinkEmail');
//        Route::post('email/resend', 'VerificationController@resend');
//        Route::get('email/verify/{id}/{hash}', 'VerificationController@verify');
    });

    Route::middleware('auth:users,ldap')->group(function () {
        Route::get('settings/all', 'ApplicationController@allSettings')->name('application.complete')->middleware('can:settings.viewAny');
        Route::put('settings', 'ApplicationController@updateSettings')->name('application.update')->middleware('can:settings.update');

        Route::apiResource('roles', 'RoleController');
        Route::apiResource('roomTypes', 'RoomTypeController');

        Route::get('permissions', 'PermissionController@index')->name('permissions.index');

        Route::get('rooms', 'RoomController@index')->name('rooms.index');
        Route::post('rooms', 'RoomController@store')->name('rooms.store');
        Route::put('rooms/{room}', 'RoomController@update')->name('rooms.update');
        Route::delete('rooms/{room}', 'RoomController@destroy')->name('rooms.destroy');

        Route::get('rooms/{room}/settings', 'RoomController@getSettings')->name('rooms.settings');

        // Membership user self add/remove
        Route::post('rooms/{room}/membership', 'RoomMemberController@join')->name('rooms.membership.join');
        Route::delete('rooms/{room}/membership', 'RoomMemberController@leave')->name('rooms.membership.leave');
        // Membership operations by room owner
        Route::get('rooms/{room}/member', 'RoomMemberController@index')->name('rooms.member.get')->middleware('can:viewMembers,room');
        Route::post('rooms/{room}/member', 'RoomMemberController@store')->name('rooms.member.add')->middleware('can:manageMembers,room');
        Route::put('rooms/{room}/member/{user}', 'RoomMemberController@update')->name('rooms.member.update')->middleware('can:manageMembers,room');
        Route::delete('rooms/{room}/member/{user}', 'RoomMemberController@destroy')->name('rooms.member.remove')->middleware('can:manageMembers,room');
        // File operations
        Route::middleware('can:manageFiles,room')->group(function () {
            Route::post('rooms/{room}/files', 'RoomFileController@store')->name('rooms.files.add');

            Route::put('rooms/{room}/files/{file}', 'RoomFileController@update')->name('rooms.files.update');
            Route::delete('rooms/{room}/files/{file}', 'RoomFileController@destroy')->name('rooms.files.remove');
        });

        Route::get('users/search', 'UserController@search')->name('users.search');
        Route::apiResource('users', 'UserController');

        Route::post('servers/check', 'ServerController@check')->name('servers.check')->middleware('can:viewAny,App\Server');
        Route::get('servers/{server}/panic', 'ServerController@panic')->name('servers.panic')->middleware('can:update,server');
        Route::apiResource('servers', 'ServerController');
    });

    Route::middleware('can:view,room')->group(function () {
        Route::get('rooms/{room}', 'RoomController@show')->name('rooms.show')->middleware('room.authenticate:true');
        Route::get('rooms/{room}/start', 'RoomController@start')->name('rooms.start')->middleware('room.authenticate');
        Route::get('rooms/{room}/join', 'RoomController@join')->name('rooms.join')->middleware('room.authenticate');
        Route::get('rooms/{room}/files', 'RoomFileController@index')->name('rooms.files.get')->middleware('room.authenticate');
        Route::get('rooms/{room}/files/{file}', 'RoomFileController@show')->name('rooms.files.show')->middleware(['can:downloadFile,room,file', 'room.authenticate']);
    });

    Route::get('meetings/{meeting}/endCallback', 'MeetingController@endMeetingCallback')->name('meetings.endcallback');
});

if (!env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', function () {
        return response()->json([ 'message' => 'Not found!' ], 404);
    })->where('any', '.*');
}
