<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use SimpleXMLElement;

class RecordingFormat extends Model
{
    use HasFactory;

    protected $fillable = [
        'url', 'format',
    ];

    protected $casts = [
        'disabled' => 'boolean',
    ];

    public static function createFromRecordingXML(SimpleXMLElement $xml)
    {
        $recordingId = (string) $xml->id;

        $startTimestamp = (int) $xml->start_time;
        $start = \Date::createFromTimestampUTC($startTimestamp / 1000);
        $endTimestamp = (int) $xml->end_time;
        $end = \Date::createFromTimestampUTC($endTimestamp / 1000);

        $meetingId = (string) $xml->meta->meetingId;
        $meetingName = (string) $xml->meta->meetingName;

        $meeting = Meeting::where('id', $meetingId)->first();

        if ($meeting != null) {
            $room = $meeting->room;
        } else {
            // Fallback to greenlight behaviour (using the persistent room id as meeting id)
            $room = Room::where('id', $meetingId)->first();
        }

        // If the room does not exist, we can't create a recording
        if ($room == null) {
            return null;
        }

        // Check if the recording already exists, if not create recording
        $recording = Recording::where('id', $recordingId)->first();
        if ($recording == null) {
            $recording = new Recording();
            $recording->id = $recordingId;
            $recording->description = $meetingName;
            $recording->start = $start;
            $recording->end = $end;
            $recording->room()->associate($room);
            $recording->meeting()->associate($meeting);
            $recording->save();
        }

        $format = (string) $xml->playback->format;
        $rawUrl = (string) $xml->playback->link;

        $urlParts = parse_url($rawUrl);
        $url = $urlParts['path'].(isset($urlParts['query']) ? '?'.$urlParts['query'] : '').(isset($urlParts['fragment']) ? '#'.$urlParts['fragment'] : '');

        return $recording->formats()->updateOrCreate(
            ['format' => $format],
            ['url' => $url]
        );
    }

    public function recording()
    {
        return $this->belongsTo(Recording::class);
    }
}
