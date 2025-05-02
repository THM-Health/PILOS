<?php

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
        Schema::create('room_type_streaming_settings', function (Blueprint $table) {
            $table->bigInteger('room_type_id')->unsigned();
            $table->foreign('room_type_id')->references('id')->on('room_types')->onDelete('cascade');
            $table->primary('room_type_id');
            $table->boolean('enabled')->default(true);
            $table->text('default_pause_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_type_streaming_settings');
    }
};
