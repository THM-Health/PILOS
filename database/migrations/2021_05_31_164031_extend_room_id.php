<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendRoomId extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('id',15)->change();
        });
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('room_id',15)->change();
        });
        Schema::table('room_files', function (Blueprint $table) {
            $table->string('room_id',15)->change();
        });
        Schema::table('room_user', function (Blueprint $table) {
            $table->string('room_id',15)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::disableForeignKeyConstraints();
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('id',11)->change();
        });
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('room_id',11)->change();
        });
        Schema::table('room_files', function (Blueprint $table) {
            $table->string('room_id',11)->change();
        });
        Schema::table('room_user', function (Blueprint $table) {
            $table->string('room_id',11)->change();
        });
        Schema::enableForeignKeyConstraints();
    }
}
