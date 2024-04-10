<?php

namespace Database\Factories;

use App\Models\Recording;
use App\Models\RecordingFormat;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecordingFormatFactory extends Factory
{
    protected $model = RecordingFormat::class;

    public function definition(): array
    {
        return [
            'recording_id' => Recording::factory(),
            'format' => $this->faker->word,
            'url' => $this->faker->url,
        ];
    }
}
