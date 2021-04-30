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
Route::get('download/file/{roomFile}/{filename?}','FileController@show')->name('download.file')->middleware('signed');
Route::get('download/attendance/{meeting}', 'MeetingController@attendance')->middleware('auth:users,ldap');

if (!env('DISABLE_CATCHALL_ROUTES')) {
    Route::any('/{any}', 'ApplicationController@index')->where('any', '.*');
}
