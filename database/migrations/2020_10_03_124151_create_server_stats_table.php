<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServerStatsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('server_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('server_id');
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->integer('participant_count')->nullable();
            $table->integer('listener_count')->nullable();
            $table->integer('voice_participant_count')->nullable();
            $table->integer('video_count')->nullable();
            $table->integer('meeting_count')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('server_stats');
    }
}
