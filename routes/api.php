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
    Route::namespace('auth')->group(function () {
        Route::get('currentUser', 'LoginController@currentUser')->name('currentUser');
        Route::post('login', 'LoginController@login')->name('login');
        Route::post('login/ldap', 'LoginController@ldapLogin')->name('ldapLogin');
        Route::post('logout', 'LoginController@logout')->name('logout');

// TODO: Implement or remove this completely
//        Route::post('register', 'RegisterController@register');
//
//        Route::post('password/reset', 'ResetPasswordController@reset');
//        Route::post('password/email', 'ForgotPasswordController@sendResetLinkEmail');
//        Route::post('password/confirm', 'ConfirmPasswordController@confirm');
//
//        Route::post('email/resend', 'VerificationController@resend');
//        Route::get('email/verify/{id}/{hash}', 'VerificationController@verify');
    });

    Route::middleware('auth:api_users,api')->group(function () {
      

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
        
        // Membership user self add/remove
        Route::post('rooms/{room}/membership', 'RoomController@joinMembership')->name('rooms.membership.join');
        Route::delete('rooms/{room}/membership', 'RoomController@leaveMembership')->name('rooms.membership.leave');
        // Membership operations by room owner
        Route::get('rooms/{room}/member', 'RoomController@getMember')->name('rooms.member.get');
        Route::post('rooms/{room}/member', 'RoomController@addMember')->name('rooms.member.add');
        Route::put('rooms/{room}/member/{user}', 'RoomController@editMember')->name('rooms.member.edit');
        Route::delete('rooms/{room}/member/{user}', 'RoomController@removeMember')->name('rooms.member.remove');
        // File operations
        Route::get('rooms/{room}/files', 'RoomController@getFiles')->name('rooms.files.get');
        Route::put('rooms/{room}/files', 'RoomController@updateFiles')->name('rooms.files.update');
        Route::post('rooms/{room}/files', 'RoomController@uploadFile')->name('rooms.files.upload');
        Route::put('rooms/{room}/files/{file}', 'RoomController@updateFile')->name('rooms.files.updatefile');
        Route::delete('rooms/{room}/files/{file}', 'RoomController@deleteFile')->name('rooms.files.remove');

        Route::get('users/search','UserController@search','users.search');


    });

    Route::apiResource('rooms', 'RoomController');
    Route::get('rooms/{room}/start','RoomController@start');
    Route::get('rooms/{room}/join','RoomController@join');
    Route::get('rooms/{room}/settings','RoomController@getSettings');
    Route::put('rooms/{room}/settings','RoomController@updateSettings');
    Route::get('meetings/{meeting}/endCallback','MeetingController@endMeetingCallback')->name('meetings.endcallback');

    Route::prefix('guest')->namespace('guest')->name('guest.')->group(function () {
        Route::get('rooms', 'RoomController@show')->name('rooms.show');

    });


});

Route::any('/{any}', function () {
    return response()->json([ 'message' => 'Not found!' ], 404);
})->where('any', '.*');
