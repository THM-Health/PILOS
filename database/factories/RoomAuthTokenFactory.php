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
            'room_token_id' => null,
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (RoomAuthToken $roomAuthToken) {
            if ($roomAuthToken->type === RoomAuthTokenType::TOKEN && $roomAuthToken->room_token_id === null) {
                $roomToken = RoomToken::factory()->create([
                    'room_id' => $roomAuthToken->room_id,
                ]);
                // ToDo improve / change to room_token_id?
                $roomAuthToken->accessToken()->associate($roomToken);
                $roomAuthToken->save();
            }
        });
    }
}
