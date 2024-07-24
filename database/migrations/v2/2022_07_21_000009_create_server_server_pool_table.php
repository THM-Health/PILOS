<?php

use Database\Seeders\ServerPoolSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('server_server_pool', function (Blueprint $table) {
            $table->foreignId('server_id')->constrained()->onDelete('cascade');
            $table->foreignId('server_pool_id')->constrained()->onDelete('cascade');
        });
        $seeder = new ServerPoolSeeder;
        $seeder->run();
    }

    public function down()
    {
        Schema::dropIfExists('server_server_pool');
    }
};
