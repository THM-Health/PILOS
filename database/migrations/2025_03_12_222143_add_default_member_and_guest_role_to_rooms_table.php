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
        Schema::table('rooms', function (Blueprint $table) {
            $table->integer('default_member_role')->default(\App\Enums\RoomUserRole::USER)->after('default_role');
            $table->integer('default_guest_role')->default(\App\Enums\RoomUserRole::USER)->after('default_member_role');
        });

        // Set default_member_role to the same value as default_role for existing rooms
        DB::table('rooms')->update(['default_member_role' => DB::raw('default_role')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('default_member_role');
            $table->dropColumn('default_guest_role');
        });
    }
};
