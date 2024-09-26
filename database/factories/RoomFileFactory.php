<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomFile;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFileFactory extends Factory
{
    protected $model = RoomFile::class;

    public function definition(): array
    {
        return [
            'path' => 'placeholder',
            'filename' => $this->faker->word.'.'.$this->faker->fileExtension(),
            'default' => false,
            'download' => false,
            'use_in_meeting' => false,
            'room_id' => Room::factory(),
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (RoomFile $roomFile) {
            $fileExt = explode('.', $roomFile->filename)[1];
            $roomFile->path = $roomFile->room->id.'/'.$this->faker->uuid.'.'.$fileExt;
            $roomFile->save();
        });
    }
}
