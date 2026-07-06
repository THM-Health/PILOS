<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

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
