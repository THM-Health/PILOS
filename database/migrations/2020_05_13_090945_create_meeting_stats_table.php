<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMeetingStatsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('meeting_stats', function (Blueprint $table) {
            $table->id();
            $table->string('meeting_id',54);
            $table->foreign('meeting_id')->references('id')->on('meetings')->onDelete('cascade');
            $table->integer('participantCount');
            $table->integer('listenerCount');
            $table->integer('voiceParticipantCount');
            $table->integer('videoCount');
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
        Schema::dropIfExists('meeting_stats');
    }
}
