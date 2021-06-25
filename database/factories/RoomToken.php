<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\RoomToken;
use Faker\Generator as Faker;

$factory->define(RoomToken::class, function (Faker $faker) {
    return [
        'firstname' => $faker->firstName,
        'lastname'  => $faker->lastName,
        'role' => App\Enums\RoomUserRole::USER,
        'room_id' => factory(App\Room::class),
    ];
});
