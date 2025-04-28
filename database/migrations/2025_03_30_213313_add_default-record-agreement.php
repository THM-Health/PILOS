<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('record_agreement')->default(false)->after('bbb_skip_check_audio');
            $table->boolean('record_video_agreement')->default(false)->after('bbb_skip_check_audio');
            $table->boolean('record_attendance_agreement')->default(false)->after('bbb_skip_check_audio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('record_agreement');
            $table->dropColumn('record_video_agreement');
            $table->dropColumn('record_attendance_agreement');
        });
    }
};
