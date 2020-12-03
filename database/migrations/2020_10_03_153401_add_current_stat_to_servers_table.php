<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCurrentStatToServersTable extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->integer('participant_count')->nullable();
            $table->integer('listener_count')->nullable();
            $table->integer('voice_participant_count')->nullable();
            $table->integer('video_count')->nullable();
            $table->integer('meeting_count')->nullable();
            $table->smallInteger('offline')->default(true);
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('participant_count');
            $table->dropColumn('listener_count');
            $table->dropColumn('voice_participant_count');
            $table->dropColumn('video_count');
            $table->dropColumn('meeting_count');
            $table->dropColumn('offline');

        });
    }
}
