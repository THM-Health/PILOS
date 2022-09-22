<?php

namespace Database\Seeders;

use App\RoomType;
use Illuminate\Database\Seeder;

class RoomTypeSeederV1 extends Seeder
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
            RoomType::create(['short' => 'LE', 'description' => 'Lecture', 'color' => '#16a085']);
            RoomType::create(['short' => 'ME', 'description' => 'Meeting', 'color' => '#2c3e50']);
            RoomType::create(['short' => 'EX', 'description' => 'Exam', 'color' => '#c0392b']);
            RoomType::create(['short' => 'SE', 'description' => 'Seminar', 'color' => '#2980b9']);
        }
    }
}
