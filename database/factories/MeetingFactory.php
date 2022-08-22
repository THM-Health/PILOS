<?php

namespace Database\Factories;

use App\Meeting;
use App\Room;
use App\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeetingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Meeting::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $length = $this->faker->numberBetween(1, 20000);
        $end    = $this->faker->date('U');

        return [
            'room_id'     => Room::factory(),
            'server_id'   => Server::factory(),
            'attendee_pw'  => $this->faker->password,
            'moderator_pw' => $this->faker->password,
            'start'       => date('Y-m-d H:i:s', $end - $length),
            'end'         => date('Y-m-d H:i:s', $end),
        ];
    }
}
