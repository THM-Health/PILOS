<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeetingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Meeting::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $length = $this->faker->numberBetween(1, 20000);
        $end = (int) $this->faker->date('U');

        return [
            'room_id' => Room::factory(),
            'server_id' => Server::factory(),
            'start' => date('Y-m-d H:i:s', $end - $length),
            'end' => date('Y-m-d H:i:s', $end),
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Meeting $meeting) {
            $meeting->room->latestMeeting()->associate($meeting);
            $meeting->room->save();
        });
    }
}
