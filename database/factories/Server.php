<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Server;
use Faker\Generator as Faker;

$factory->define(Server::class, function (Faker $faker) {
    return [
        'baseUrl' => 'https://test.notld/bigbluebutton/',
        'salt' => $faker->sha1,
        'description' => $faker->text,
        'status' => \App\Enums\ServerStatus::ONLINE,
    ];
});
