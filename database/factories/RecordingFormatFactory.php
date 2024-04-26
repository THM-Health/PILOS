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
        $recording = Recording::factory()->create();
        $formats = ['video', 'podcast', 'notes', 'screenshare', 'presentation'];

        $format = $this->faker->randomElement($formats);

        return [
            'recording_id' => $recording->id,
            'format' => $format,
            'url' => $this->generateUrl($recording->id, $format),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (RecordingFormat $recordingFormat) {
            $recordingFormat->url = $this->generateUrl($recordingFormat->recording->id, $recordingFormat->format);
            $recordingFormat->save();
        });
    }

    public function generateUrl($recordingId, $format): string
    {
        $domain = "https://{$this->faker->domainName}";
        $paths = [
            'video' => "/playback/video/{$recordingId}/",
            'podcast' => "/podcast/{$recordingId}/audio.ogg",
            'notes' => "/notes/{$recordingId}/notes.pdf",
            'screenshare' => "/recording/screenshare/{$recordingId}/",
            'presentation' => "/playback/presentation/2.3/{$recordingId}",
        ];

        return $domain.$paths[$format];
    }
}
