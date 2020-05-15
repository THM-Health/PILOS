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

Route::get('/', function () {
    return redirect()->route('meetings.index');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('rooms', 'RoomController');
    Route::resource('server', 'ServerController');
    Route::resource('meetings', 'MeetingController');
});

Auth::routes(['register'=>false]);

Route::get('/home', 'HomeController@index')->name('home');
