<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddServerPoolToRoomTypes extends Migration
{
    public function up()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->unsignedBigInteger('server_pool_id')->default(\App\ServerPool::all()->first()->id);
            $table->foreign('server_pool_id')->references('id')->on('server_pools')->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('server_pool_id');
        });
    }
}
