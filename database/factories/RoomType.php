<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Room;
use App\RoomType;
use Faker\Generator as Faker;

$factory->define(RoomType::class, function (Faker $faker) {
    return [
        'short' => $faker->word,
        'description' => $faker->word,
        'color' => $faker->hexColor,
        'default' => $faker->boolean,
    ];
});
