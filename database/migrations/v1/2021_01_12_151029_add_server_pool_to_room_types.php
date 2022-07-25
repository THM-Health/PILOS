<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddServerPoolToRoomTypes extends Migration
{
    public function up()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->foreignId('server_pool_id')->nullable()->constrained()->onDelete('restrict');
        });
        Schema::table('room_types', function (Blueprint $table) {
            foreach (\App\Models\RoomType::all() as $roomType) {
                $roomType->serverPool()->associate(\App\Models\ServerPool::all()->first()->id);
                $roomType->save();
            }
            $table->foreignId('server_pool_id')->nullable(false)->change();
        });
    }

    public function down()
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropForeign(['server_pool_id']);
            $table->dropColumn('server_pool_id');
        });
    }
}
