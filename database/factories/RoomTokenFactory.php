<?php

namespace Database\Factories;

use App\Enums\RoomUserRole;
use App\Models\Room;
use App\Models\RoomToken;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomTokenFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = RoomToken::class;

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
