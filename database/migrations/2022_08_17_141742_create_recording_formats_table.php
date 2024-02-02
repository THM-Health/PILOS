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
        Schema::create('recording_formats', function (Blueprint $table) {
            $table->id();
            $table->string('recording_id');
            $table->foreign('recording_id')->references('id')->on('recordings')->onDelete('cascade');
            $table->string('format');
            $table->string('url');
            $table->boolean('disabled')->default(false);
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
        Schema::dropIfExists('recording_formats');
    }
};
