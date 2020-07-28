<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateRoomUser extends Migration
{
    public function up()
    {
        Schema::table('room_user', function (Blueprint $table) {
            $table->string('room_id',11)->change();
            $table->tinyInteger('role')->default(\App\Enums\RoomUserRole::USER);
            $table->dropColumn('moderator');
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');

        });
    }

    public function down()
    {
        Schema::table('room_user', function (Blueprint $table) {
            //
        });
    }
}
