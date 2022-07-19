<?php

namespace App\Services;

use Faker\Factory;

class RoomTestHelper
{
    /**
     * Create valid random room name
     * @return string
     */
    public static function createValidRoomName()
    {
        $faker = Factory::create();
        while (true) {
            $name = $faker->word;
            if (strlen($name) > 1 && strlen($name) < config('bigbluebutton.room_name_limit') ) {
                return $name;
            }
        }
    }
}
