<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Session>
 */
class SessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => \Str::random(40),
            'user_id' => User::factory(),
            'ip_address' => $this->faker->ipv4,
            'user_agent' => $this->faker->userAgent,
            'payload' => base64_encode(serialize(['_token' => \Str::random(40), '_flash' => ['old' => [], 'new' => []]])),
            'last_activity' => $this->faker->dateTimeBetween('-1 day', 'now'),
        ];
    }
}
