<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCurrentStatToRoomsTable extends Migration
{
    public function up()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('participant_count')->nullable();
            $table->integer('listener_count')->nullable();
            $table->integer('voice_participant_count')->nullable();
            $table->integer('video_count')->nullable();
        });
    }

    public function down()
    {
        Schema::table('rooms', function (Blueprint $table) {
            //
        });
    }
}
