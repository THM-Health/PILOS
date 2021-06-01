<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoomSchedulesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('room_id',15);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->string('name');
            $table->string('description');
            $table->dateTime('start');
            $table->dateTime('end');
            $table->string('timezone')->default('UTC');
            $table->boolean('repeat');
            $table->dateTime('repeat_until');
            $table->timestamps();
        });

        Schema::table('room_users', function (Blueprint $table) {
           $table->boolean('enable_notifications')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('room_schedules');

        Schema::table('room_users', function (Blueprint $table) {
            $table->dropColumn('enable_notifications');
        });
    }
}
