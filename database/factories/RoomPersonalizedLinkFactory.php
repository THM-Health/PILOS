<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\RoomUserRole;
use App\Models\Room;
use App\Models\RoomPersonalizedLink;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomPersonalizedLinkFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = RoomPersonalizedLink::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'firstname' => $this->faker->firstName,
            'lastname' => $this->faker->lastName,
            'role' => RoomUserRole::USER,
            'room_id' => Room::factory(),
        ];
    }
}
