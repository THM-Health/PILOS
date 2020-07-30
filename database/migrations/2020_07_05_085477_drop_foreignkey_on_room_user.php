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

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('rooms', function (Blueprint $table) {
                $table->dropForeign(['parentMeetingID']);
                $table->dropForeign(['preferedServer']);
                $table->dropForeign(['room_type_id']);
            });
        }

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
