<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateRoomUser extends Migration
{
    public function up()
    {
        Schema::create('room_user', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('room_id',11);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->primary(['user_id', 'room_id']);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->tinyInteger('role')->default(\App\Enums\RoomUserRole::USER);
        });
    }

    public function down()
    {
        Schema::table('room_user', function (Blueprint $table) {
            Schema::dropIfExists('room_user');
        });
    }
}
