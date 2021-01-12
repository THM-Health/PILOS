<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Server;
use Faker\Generator as Faker;

$factory->define(Server::class, function (Faker $faker) {
    return [
        'base_url' => 'https://test.notld/bigbluebutton/',
        'salt'     => $faker->sha1,
        'name'     => $faker->unique()->word,
        'status'   => \App\Enums\ServerStatus::ONLINE,
        'strength' => 1,
    ];
});
