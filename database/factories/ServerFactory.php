<?php

namespace Database\Factories;

use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Server::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'base_url' => 'https://test.notld/bigbluebutton/',
            'secret' => $this->faker->sha1,
            'name' => $this->faker->unique()->word,
            'status' => \App\Enums\ServerStatus::ONLINE,
            'version' => '2.4.5',
            'strength' => 1,
        ];
    }
}
