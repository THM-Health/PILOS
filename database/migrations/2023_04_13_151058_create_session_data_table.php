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
        Schema::create('session_data', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->text('value');
            $table->string('session_id');
            $table
            ->foreign('session_id')
            ->references('id')
            ->on('sessions')
            ->onUpdate('cascade')
            ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_data');
    }
};
