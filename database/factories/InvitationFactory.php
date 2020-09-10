<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Invitation;
use Faker\Generator as Faker;

$factory->define(Invitation::class, function (Faker $faker) {
    return [
        'email'            => $faker->unique()->safeEmail,
        'invitation_token' => $faker->uuid
    ];
});
