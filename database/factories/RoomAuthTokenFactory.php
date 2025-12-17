<?php

namespace Database\Factories;

use App\Enums\RoomAuthTokenType;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Models\RoomToken;
use App\Models\Session;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomAuthTokenFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = RoomAuthToken::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'session_id' => Session::factory(),
            'type' => $this->faker->randomElement([
                RoomAuthTokenType::CODE,
                RoomAuthTokenType::TOKEN,
            ]),
            'room_id' => Room::factory(),
            'room_token_id' => function (array $attributes) {
                if ($attributes['type'] === RoomAuthTokenType::TOKEN) {
                    return RoomToken::factory()->create([
                        'room_id' => $attributes['room_id'],
                    ]);
                }

                return null;
            },
        ];
    }
}
