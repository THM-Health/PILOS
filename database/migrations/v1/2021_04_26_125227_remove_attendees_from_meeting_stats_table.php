<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveAttendeesFromMeetingStatsTable extends Migration
{
    public function up()
    {
        Schema::table('meeting_stats', function (Blueprint $table) {
            $table->dropColumn('attendees');
        });
    }

    public function down()
    {
        Schema::table('meeting_stats', function (Blueprint $table) {
            $table->text('attendees')->nullable();
        });
    }
}
