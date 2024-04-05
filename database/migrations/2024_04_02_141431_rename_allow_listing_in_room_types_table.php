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
            $table->integer('allow_listing')->default(\App\Enums\RoomVisibility::PRIVAT)->change();
            $table->renameColumn('allow_listing', 'visibility_default');

            $table->boolean('visibility_enforced')->default(false);
        });

        RoomType::where('visibility_default', 0)->update(['visibility_enforced' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('visibility_default')->default(false)->change();
            $table->renameColumn('visibility_default', 'allow_listing');
            $table->dropColumn('visibility_enforced');
        });
    }
};
