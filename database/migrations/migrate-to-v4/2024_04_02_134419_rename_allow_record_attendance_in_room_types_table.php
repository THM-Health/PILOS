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
            $table->boolean('allow_record_attendance')->default(false)->change();
            $table->renameColumn('allow_record_attendance', 'record_attendance_default');
            $table->boolean('record_attendance_enforced')->default(false);
        });

        RoomType::where('record_attendance_default', false)->update(['record_attendance_enforced' => true]);
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
