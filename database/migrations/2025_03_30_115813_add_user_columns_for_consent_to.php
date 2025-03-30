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
            $table->boolean('consent_to_presence_recording')->default(false)->after('bbb_skip_check_audio');
            $table->boolean('consent_to_recording')->default(false)->after('bbb_skip_check_audio');
            $table->boolean('consent_to_recording_image')->default(false)->after('bbb_skip_check_audio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('consent_to_presence_recording');
            $table->dropColumn('consent_to_recording');
            $table->dropColumn('consent_to_recording_image');
        });
    }
};
