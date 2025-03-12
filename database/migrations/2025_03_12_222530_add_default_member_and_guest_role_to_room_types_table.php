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
            $table->integer('default_member_role_default')->default(\App\Enums\RoomUserRole::USER)->after('default_role_enforced');
            $table->integer('default_member_role_enforced')->default(false)->after('default_member_role_default');
            $table->integer('default_guest_role_default')->default(\App\Enums\RoomUserRole::GUEST)->after('default_member_role_enforced');
            $table->integer('default_guest_role_enforced')->default(false)->after('default_guest_role_default');
        });

        // Set default and enforced value to default_member_role to default_role
        DB::table('room_types')->update([
            'default_member_role_default' => DB::raw('default_role_default'),
            'default_member_role_enforced' => DB::raw('default_role_enforced'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('default_member_role_default');
            $table->dropColumn('default_member_role_enforced');
            $table->dropColumn('default_guest_role_default');
            $table->dropColumn('default_guest_role_enforced');
        });
    }
};
