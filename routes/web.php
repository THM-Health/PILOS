<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::get('download/file/{roomFile}/{filename?}', 'FileController@show')->name('download.file')->middleware('signed');

if (config('greenlight.compatibility')) {
    Route::prefix(config('greenlight.base'))->group(function () {
        // room urls
        Route::get('/{id}', function ($id) {
            return redirect('/rooms/'.$id);
        })->where('id', '([A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3})');
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
    Route::any('/{any}', 'ApplicationController@index')->where('any', '.*');
}
