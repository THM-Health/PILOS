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
        Schema::create('meetings', function (Blueprint $table) {
            $table->string('id');
            $table->primary('id');
            $table->string('room_id', 15);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->unsignedBigInteger('server_id')->nullable();
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->unique('id');
            $table->boolean('is_breakout')->default(false);
            $table->integer('sequence')->default(0);
            $table->dateTime('start')->nullable();
            $table->dateTime('end')->nullable();
            $table->boolean('record_attendance')->default(false);
            $table->boolean('record')->default(false);
            $table->dateTime('detached')->nullable();
            $table->softDeletes();
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
        Schema::dropIfExists('meetings');
    }
};
