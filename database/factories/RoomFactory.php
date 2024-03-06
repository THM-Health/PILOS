<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
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
            'name' => self::createValidRoomName(),
            'room_type_id' => RoomType::factory(),
            'user_id' => User::factory(),
        ];
    }

    /**
     * Create valid random room name
     *
     * @return string
     */
    public static function createValidRoomName()
    {
        $faker = \Faker\Factory::create();
        while (true) {
            $name = $faker->word;
            if (strlen($name) > 1 && strlen($name) < config('bigbluebutton.room_name_limit')) {
                return $name;
            }
        }
    }
}
