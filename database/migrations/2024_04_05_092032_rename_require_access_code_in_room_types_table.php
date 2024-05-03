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
            $table->renameColumn('require_access_code', 'has_access_code_enforced');
            $table->boolean('has_access_code_default')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (RoomType::all() as $roomType) {
            $roomType->has_access_code_enforced = $roomType->has_access_code_default && $roomType->has_access_code_enforced;
            $roomType->save();
        }

        Schema::table('room_types', function (Blueprint $table) {
            $table->renameColumn('has_access_code_enforced', 'require_access_code');
            $table->dropColumn('has_access_code_default');
        });
    }
};
