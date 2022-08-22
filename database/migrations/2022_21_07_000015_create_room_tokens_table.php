<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_tokens', function (Blueprint $table) {
            $table->string('token', 100)->unique();
            $table->string('room_id',15);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->primary(['token', 'room_id']);
            $table->string('firstname');
            $table->string('lastname');
            $table->tinyInteger('role')->default(\App\Enums\RoomUserRole::USER);
            $table->dateTime('last_usage')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('room_tokens');
    }
};
