<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('room_personalized_links', function (Blueprint $table) {
            $table->string('description')->after('room_id');
            $table->string('enforced_name')->after('description')->nullable();
        });

        DB::table('room_personalized_links')->update([
            'enforced_name' => DB::raw('CONCAT(firstname, " ", lastname)'),
            'description' => DB::raw('CONCAT(firstname, " ", lastname)'),
        ]);

        Schema::table('room_personalized_links', function (Blueprint $table) {
            $table->dropColumn(['firstname', 'lastname']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_personalized_links', function (Blueprint $table) {
            Schema::table('room_personalized_links', function (Blueprint $table) {
                $table->string('firstname')->after('room_id');
                $table->string('lastname')->after('firstname');
            });

            DB::table('room_personalized_links')->update([
                'firstname' => DB::raw('enforced_name'),
                'lastname' => '',
            ]);

            Schema::table('room_personalized_links', function (Blueprint $table) {
                $table->dropColumn(['description', 'enforced_name']);
            });
        });
    }
};
