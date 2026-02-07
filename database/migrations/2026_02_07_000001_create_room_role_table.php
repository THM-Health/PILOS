<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->string('room_id', 15);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->primary(['role_id', 'room_id']);
            $table->tinyInteger('role')->default(\App\Enums\RoomUserRole::USER);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('room_role');
    }
};
