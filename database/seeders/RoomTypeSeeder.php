<?php

namespace Database\Seeders;

use App\Models\RoomType;
use App\Models\ServerPool;
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
                ['short' => 'LE', 'description' => 'Lecture', 'color' => '#16a085'],
                ['short' => 'ME', 'description' => 'Meeting', 'color' => '#2c3e50'],
                ['short' => 'EX', 'description' => 'Exam', 'color' => '#c0392b'],
                ['short' => 'SE', 'description' => 'Seminar', 'color' => '#2980b9']
            ]);
        }
    }
}
