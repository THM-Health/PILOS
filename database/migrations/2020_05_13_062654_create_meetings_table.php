<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMeetingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->string('id',54);
            $table->primary('id');
            $table->string('room_id',54);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->boolean('isBreakout')->default(false);
            $table->string('parentMeetingID',54)->nullable();
            $table->foreign('parentMeetingID')->references('id')->on('meetings')->onDelete('cascade');
            $table->dateTime('start');
            $table->dateTime('end')->nullable();
            $table->unsignedBigInteger('server_id')->nullable();
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('set null');
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
}
