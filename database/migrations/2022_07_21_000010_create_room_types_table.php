<?php

use Database\Seeders\RoomTypeSeeder;
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
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color', 7);
            $table->boolean('allow_listing')->default(false);
            $table->boolean('restrict')->default(false);
            $table->foreignId('server_pool_id')->constrained()->onDelete('restrict');
            $table->integer('max_participants')->nullable();
            $table->integer('max_duration')->nullable();
            $table->boolean('require_access_code')->default(false);
            $table->boolean('allow_record_attendance')->default(true);
            $table->timestamps();
        });

        $seeder = new RoomTypeSeeder();
        $seeder->run();
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('room_types');
    }
};
