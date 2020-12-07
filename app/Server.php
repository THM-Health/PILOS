<?php

namespace App;

use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public $timestamps = false;

    const VIDEO_WEIGHT       = 3;
    const AUDIO_WEIGHT       = 2;
    const PARTICIPANT_WEIGHT = 1;

    protected $casts = [
        'offline'    => 'boolean',
        'status'     => 'boolean',
    ];

    /**
     * Find server with the lowest usage
     * @return Server|null
     */
    public static function lowestUsage()
    {
        return self::where('status', true)
            ->where('offline', false)
            // Experimental
            // Have video factor 3, audio factor 2 and just listening factor 1
            ->orderByRaw('(video_count*'.self::VIDEO_WEIGHT.' + voice_participant_count*'.self::AUDIO_WEIGHT.' + (participant_count-voice_participant_count) * '.self::PARTICIPANT_WEIGHT.') ASC')
            ->first();
    }

    /**
     * Return usage of a server, based on video, audio and participants
     * @return int
     */
    public function getUsageAttribute()
    {
        // Experimental
        // Have video factor 3, audio factor 2 and just listening factor 1
        return $this->video_count * self::VIDEO_WEIGHT + $this->voice_participant_count * self::AUDIO_WEIGHT + ($this->participant_count - $this->voice_participant_count) * self::PARTICIPANT_WEIGHT;
    }

    /**
     * Get bigbluebutton api instance with the url and secret stored in the database fields
     * @return BigBlueButton
     * @throws \Exception
     */
    public function bbb()
    {
        return new BigBlueButton($this->baseUrl, $this->salt);
    }

    /**
     * Get list of currently running meeting from the api
     * @return \BigBlueButton\Core\Meeting[]|null
     */
    public function getMeetings()
    {
        if (!$this->status) {
            return null;
        }

        try {
            $response = $this->bbb()->getMeetings();
            if ($response->failed()) {
                return null;
            }

            return $response->getMeetings();
        } catch (\Exception $exception) {
            // TODO add better error handling when provided by api
            return null;
        }
    }

    /**
     * Meetings that (have) run on this server
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Statistical data of this server
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function stats()
    {
        return $this->hasMany(ServerStat::class);
    }
}
