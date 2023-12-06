<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDefaultToRoomTypes extends Migration
{
    public function up()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('default')->default(false);
        });
    }

    public function down()
    {
        Schema::table('rom_types', function (Blueprint $table) {
            $table->dropColumn('default');
        });
    }
}
