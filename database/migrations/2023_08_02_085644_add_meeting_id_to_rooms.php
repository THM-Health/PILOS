<?php

use App\Models\Room;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('meeting_id')->nullable();
            $table->foreign('meeting_id')->references('id')->on('meetings')->nullOnDelete();
        });

        foreach (Room::with('meetings')->get() as $room) {
            $room->latestMeeting()->associate($room->meetings()->orderByDesc('created_at')->first()?->id);
            $room->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['meeting_id']);
            $table->dropColumn('meeting_id');
        });
    }
};
