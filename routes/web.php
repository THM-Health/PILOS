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
Route::get('download/file/{room}/{roomFile}/{filename?}','FileController@show')->name('download.file')->middleware(['can:downloadFile,room,roomFile','room.guest_protection','room.authenticate']);
Route::get('bbb/file/{roomFile}/{filename?}','FileController@download')->name('bbb.file')->middleware('signed');
Route::any('/{any}', 'ApplicationController@index')->where('any', '.*');
