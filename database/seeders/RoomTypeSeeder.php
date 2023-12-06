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
                ['description' => 'Lecture', 'color' => '#16a085'],
                ['description' => 'Meeting', 'color' => '#2c3e50'],
                ['description' => 'Exam', 'color' => '#c0392b'],
                ['description' => 'Seminar', 'color' => '#2980b9']
            ]);

/*
            $roomType = new RoomType();
            $roomType->description = 'Lecture';
            $roomType->color = '#16a085';
            $roomType->serverPool()->associate($pool);
            $roomType->save();

            $roomType = new RoomType();
            $roomType->description = 'Meeting';
            $roomType->color = '#2c3e50';
            $roomType->serverPool()->associate($pool);
            $roomType->save();

            $roomType = new RoomType();
            $roomType->description = 'Exam';
            $roomType->color = '#c0392b';
            $roomType->serverPool()->associate($pool);
            $roomType->save();

            $roomType = new RoomType();
            $roomType->description = 'Seminar';
            $roomType->color = '#2980b9';
            $roomType->serverPool()->associate($pool);
            $roomType->save();*/
        }
    }
}
