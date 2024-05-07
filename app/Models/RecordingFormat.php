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

    /**
     * Create a recording format and recording (if it doesn't exist yet) in the database from the metadata of a recording format provided by BigBlueButton.
     *
     * @param  SimpleXMLElement  $xml  The metadata xml of the recording format.
     * @return RecordingFormat|null The created recording format or null if the recording format could not be associated with a room.
     */
    public static function createFromRecordingXML(SimpleXMLElement $xml)
    {
        // Get the ID of the recording from the XML
        $recordingId = (string) $xml->id;

        // Get start and end time of the recording from the XML
        // The timestamps are in milliseconds, so we need to divide by 1000 to get seconds
        $startTimestamp = (int) $xml->start_time;
        $start = \Date::createFromTimestampUTC($startTimestamp / 1000);
        $endTimestamp = (int) $xml->end_time;
        $end = \Date::createFromTimestampUTC($endTimestamp / 1000);

        // Get the external meeting ID and name of the meeting from the XML
        $meetingId = (string) $xml->meta->meetingId;
        $meetingName = (string) $xml->meta->meetingName;

        // Find the meeting with the given id
        $meeting = Meeting::where('id', $meetingId)->first();

        // If the meeting exists, get the room from the meeting
        // Otherwise, find the room with the given id
        if ($meeting != null) {
            $room = $meeting->room;
        } else {
            // Fallback to greenlight behaviour (using the persistent room id as meeting id)
            $room = Room::where('id', $meetingId)->first();
        }

        // If the room does not exist, we can't associate the recording format with a room
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

        // Get the format name (e.g. 'presentation') and URL of the recording format from the XML
        $format = (string) $xml->playback->format;
        $rawUrl = (string) $xml->playback->link;

        // Parse the URL and remove the host, etc. to make it relative
        // e.g. https://bbb.example.com/notes/05afc24cf12d50e3a285dc1bc86ea66a17dcd32f-1660729175114/notes.pdf
        // -> /notes/05afc24cf12d50e3a285dc1bc86ea66a17dcd32f-1660729175114/notes.pdf
        $urlParts = parse_url($rawUrl);
        $url = $urlParts['path'].(isset($urlParts['query']) ? '?'.$urlParts['query'] : '').(isset($urlParts['fragment']) ? '#'.$urlParts['fragment'] : '');

        // Update or create a new recording format with the given format and URL
        return $recording->formats()->updateOrCreate(
            ['format' => $format],
            ['url' => $url]
        );
    }

    /**
     * Recording the recording format belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function recording()
    {
        return $this->belongsTo(Recording::class);
    }
}
