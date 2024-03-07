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
        Schema::create('meeting_attendees', function (Blueprint $table) {
            $table->id();
            $table->string('meeting_id');
            $table->foreign('meeting_id')->references('id')->on('meetings')->onDelete('cascade');
            $table->string('name')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->dateTime('join');
            $table->dateTime('leave')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('meeting_attendees');
    }
};
