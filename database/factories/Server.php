<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Server;
use Faker\Generator as Faker;

$factory->define(Server::class, function (Faker $faker) {
    return [
        'baseUrl' => $faker->url,
        'salt' => $faker->sha1,
        'description' => $faker->text,
        'status' => 1,
        'offline' => 0
    ];
});
