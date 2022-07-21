<?php

namespace Database\Seeders;

use App\RoomType;
use App\ServerPool;
use Illuminate\Database\Seeder;

class RoomTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Only create room types if none exits
        if(RoomType::all()->count()==0) {
            $pool = ServerPool::all()->first();
            $pool->roomTypes()->createMany([
                ['short' => 'VL', 'description' => 'Vorlesung', 'color' => '#80BA27'],
                ['short' => 'ME', 'description' => 'Meeting', 'color' => '#4a5c66'],
                ['short' => 'PR', 'description' => 'Prüfung', 'color' => '#9C132E'],
                ['short' => 'ÜB', 'description' => 'Übung', 'color' => '#00B8E4']
            ]);
        }
    }
}
