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
        Schema::create('room_streaming', function (Blueprint $table) {
            $table->string('room_id');
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->primary('room_id');
            $table->boolean('enabled')->default(false);
            $table->boolean('enabled_for_current_meeting')->default(false);
            $table->text('url')->nullable();
            $table->text('pause_image')->nullable();
            $table->text('status')->nullable();
            $table->integer('fps')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_streaming');
    }
};
