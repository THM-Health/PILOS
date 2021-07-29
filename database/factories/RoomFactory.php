<?php

namespace Database\Factories;

use App\Room;
use App\RoomType;
use App\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Room::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name'         => $this->faker->word,
            'room_type_id' => RoomType::factory(),
            'user_id'      => User::factory(),
        ];
    }
}
