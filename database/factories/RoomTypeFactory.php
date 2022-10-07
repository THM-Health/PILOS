<?php

namespace Database\Factories;

use App\Models\RoomType;
use App\Models\ServerPool;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomTypeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = RoomType::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'short' => $this->faker->randomLetter . "" . $this->faker->randomLetter,
            'description' => $this->faker->word,
            'color' => $this->faker->hexColor,
            'server_pool_id' => ServerPool::factory()
        ];
    }
}
