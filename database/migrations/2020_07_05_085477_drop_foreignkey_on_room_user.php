<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropForeignkeyOnRoomUser extends Migration
{
    public function up()
    {

        Schema::table('room_user', function (Blueprint $table) {
            $table->drop();
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['parentMeetingID','preferedServer']);
        });
    }

    public function down()
    {
        Schema::table('room_user', function (Blueprint $table) {
            //
        });
    }
}
