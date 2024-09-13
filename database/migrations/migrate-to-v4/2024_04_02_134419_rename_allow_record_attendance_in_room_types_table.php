<?php

use App\Models\RoomType;
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
        Schema::table('room_types', function (Blueprint $table) {
            $table->renameColumn('allow_record_attendance', 'record_attendance_default');
        });

        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('record_attendance_default')->default(false)->change();
            $table->boolean('record_attendance_enforced')->default(false);
        });

        // All room types that didn't allow record attendance should now have the setting disabled and enforced to equal the previous behavior
        RoomType::where('record_attendance_default', false)->update(['record_attendance_enforced' => true]);

        // All room types that allowed record attendance should now have the setting default to false (old default behavior) but not enforced
        RoomType::where('record_attendance_default', true)->update(['record_attendance_default' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->renameColumn('record_attendance_default', 'allow_record_attendance');
            $table->dropColumn('record_attendance_enforced');
        });
    }
};
