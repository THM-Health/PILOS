<?php

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
            $table->boolean('dialin_pin_enforced')->after('has_access_code_default')->default(false);
            $table->boolean('dialin_pin_default')->after('dialin_pin_enforced')->default(false);
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('dialin_pin')->nullable()->unique()->after('meeting_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('dialin_pin_enforced');
            $table->dropColumn('dialin_pin_default');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('dialin_pin');
        });
    }
};
