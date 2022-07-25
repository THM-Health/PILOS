<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\RoomTestHelper;
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
            'name'         => RoomTestHelper::createValidRoomName(),
            'room_type_id' => RoomType::factory(),
            'user_id'      => User::factory(),
        ];
    }
}
