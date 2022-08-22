<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoomLimitToRoles extends Migration
{
    public function up()
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->integer('room_limit')->nullable();
        });
    }

    public function down()
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('room_limit');
        });
    }
}
