<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoleRoomTypeTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('role_room_type', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('room_type_id')->constrained()->onDelete('cascade');
        });
        Schema::table('room_types', function (Blueprint $table) {
            $table->boolean('restrict')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('role_room_type');
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('restrict');
        });
    }
}
