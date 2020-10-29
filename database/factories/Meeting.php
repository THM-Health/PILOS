<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Room;
use Faker\Generator as Faker;

$factory->define(\App\Meeting::class, function (Faker $faker) {

    $length = $faker->numberBetween(1,20000);
    $end = $faker->date("U");

    return [
        'room_id' => factory(App\Room::class),
        'server_id' => factory(App\Server::class),
        'attendeePW' => $faker->password,
        'moderatorPW' => $faker->password,
        'start' => date("Y-m-d H:i:s",$end-$length),
        'end' => date("Y-m-d H:i:s",$end),
    ];
});
