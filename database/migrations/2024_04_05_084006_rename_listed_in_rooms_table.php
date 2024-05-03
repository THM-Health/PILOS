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
            $table->integer('listed')->default(\App\Enums\RoomVisibility::PRIVATE)->change();
            $table->renameColumn('listed', 'visibility');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->boolean('visibility')->default(false)->change();
            $table->renameColumn('visibility', 'listed');
        });
    }
};
