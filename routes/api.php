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
        Route::post('login', 'LoginController@usersLogin')->name('login');
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

    Route::middleware('auth:users,ldap')->group(function () {
        Route::apiResource('rooms', 'RoomController');

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
    });
});

Route::any('/{any}', function () {
    return response()->json([ 'message' => 'Not found!' ], 404);
})->where('any', '.*');
