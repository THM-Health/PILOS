<?php

namespace Database\Factories;

use App\Models\ServerPool;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServerPoolFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ServerPool::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->unique()->word,
            'description' => $this->faker->text,
        ];
    }
}
