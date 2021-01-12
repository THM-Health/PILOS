<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServerServerPoolTable extends Migration
{
    public function up()
    {
        Schema::create('server_server_pool', function (Blueprint $table) {
            $table->unsignedBigInteger('server_id')->nullable();
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->unsignedBigInteger('server_pool_id')->nullable();
            $table->foreign('server_pool_id')->references('id')->on('server_pools')->onDelete('cascade');
        });
        $seeder = new ServerPoolSeeder();
        $seeder->run();
    }

    public function down()
    {
        Schema::dropIfExists('server_server_pool');
    }
}
