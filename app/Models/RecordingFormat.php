<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use SimpleXMLElement;

class RecordingFormat extends Model
{
    use HasFactory;
    protected $fillable = [
        'url','format'
    ];

    protected $casts = [
        'disabled'  => 'boolean',
    ];

    public static function createFromRecordingXML(SimpleXMLElement $xml)
    {
        $internalMeetingId = (string) $xml->meeting->attributes()->id;

        $startTimestamp = (int) $xml->start_time;
        $start          = \Date::createFromTimestampUTC($startTimestamp / 1000);
        $endTimestamp   = (int) $xml->end_time;
        $end            = \Date::createFromTimestampUTC($endTimestamp / 1000);

        $meeting = Meeting::where('internal_meeting_id', $internalMeetingId)->first();
        if ($meeting == null) {
            return null;
        }

        $recording = $meeting->recording()->updateOrCreate(
            [],
            ['start' => $start, 'end' => $end]
        );

        $format = (string) $xml->playback->format;
        $rawUrl = (string) $xml->playback->link;

        $urlParts = parse_url($rawUrl);
        $url      = $urlParts['path'] . (isset($urlParts['query']) ? '?'.$urlParts['query'] : '') . (isset($urlParts['fragment']) ? '#'.$urlParts['fragment'] : '') ;

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
