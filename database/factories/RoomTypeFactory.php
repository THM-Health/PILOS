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
            'name' => $this->faker->word,
            'color' => $this->faker->hexColor,
            'server_pool_id' => ServerPool::factory()
        ];
    }
}
