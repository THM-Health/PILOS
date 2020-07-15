<?php

use Illuminate\Support\Facades\Route;

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
        Route::get('currentUser', 'LoginController@currentUser');
        Route::post('login', 'LoginController@login');
        Route::post('login/ldap', 'LoginController@ldapLogin');
        Route::post('logout', 'LoginController@logout');
        Route::post('register', 'RegisterController@register');

        Route::post('password/reset', 'ResetPasswordController@reset');
        Route::post('password/email', 'ForgotPasswordController@sendResetLinkEmail');
        Route::post('password/confirm', 'ConfirmPasswordController@confirm');

        Route::post('email/resend', 'VerificationController@resend');
        Route::get('email/verify/{id}/{hash}', 'VerificationController@verify');
    });
    Route::middleware('auth:api_users,api')->group(function () {
        Route::post('rooms/{room}/membership', 'RoomController@joinMembership')->name('rooms.membership.join');
        Route::delete('rooms/{room}/membership', 'RoomController@leaveMembership')->name('rooms.membership.leave');


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
    return response()->json([ 'error' => 404 ], 404);
})->where('any', '.*');
