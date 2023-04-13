<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'firstname'         => fake()->firstName,
            'lastname'          => fake()->lastName,
            'external_id'       => fake()->userName,
            'email'             => fake()->unique()->safeEmail,
            'email_verified_at' => now(),
            'password'          => fake()->password,
            'remember_token'    => Str::random(10)
        ];
    }
}
