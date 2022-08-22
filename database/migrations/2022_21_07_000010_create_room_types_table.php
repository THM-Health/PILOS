<?php

use Database\Seeders\RoomTypeSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('short',2);
            $table->string('description');
            $table->string('color',7);
            $table->boolean('allow_listing')->default(false);
            $table->boolean('restrict')->default(false);
            $table->foreignId('server_pool_id')->constrained()->onDelete('restrict');
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
