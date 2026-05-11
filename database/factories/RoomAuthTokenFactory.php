<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\RoomAuthTokenType;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Models\RoomPersonalizedLink;
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
                RoomAuthTokenType::PERSONALIZED_LINK,
            ]),
            'room_id' => Room::factory(),
            'room_personalized_link_id' => null,
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (RoomAuthToken $roomAuthToken) {
            if ($roomAuthToken->type === RoomAuthTokenType::PERSONALIZED_LINK && $roomAuthToken->room_personalized_link_id === null) {
                $link = RoomPersonalizedLink::factory()->create([
                    'room_id' => $roomAuthToken->room_id,
                ]);
                $roomAuthToken->personalizedLink()->associate($link);
                $roomAuthToken->save();
            }
        });
    }
}
