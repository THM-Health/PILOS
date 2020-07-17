<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoomFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_files', function (Blueprint $table) {
            $table->id();
            $table->string('path');
            $table->string('filename');
            $table->boolean('default')->default(false);
            $table->boolean('download')->default(false);
            $table->boolean('useinmeeting')->default(false);
            $table->string('room_id',11);
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
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
        Schema::dropIfExists('room_files');
    }
}
