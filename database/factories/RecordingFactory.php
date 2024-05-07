<?php

namespace Database\Factories;

use App\Enums\RecordingAccess;
use App\Models\Recording;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecordingFactory extends Factory
{
    protected $model = Recording::class;

    public function definition(): array
    {
        $length = $this->faker->numberBetween(1, 20000);
        $end = $this->faker->date('U');

        return [
            'id' => $this->faker->uuid,
            'room_id' => Room::factory(),
            'description' => $this->faker->text,
            'access' => RecordingAccess::OWNER,
            'start' => date('Y-m-d H:i:s', $end - $length),
            'end' => date('Y-m-d H:i:s', $end),
        ];
    }
}
