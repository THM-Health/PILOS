<?php

namespace App;

use App\Enums\ServerStatus;
use App\Traits\AddsModelNameTrait;
use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    use AddsModelNameTrait;

    const VIDEO_WEIGHT       = 3;
    const AUDIO_WEIGHT       = 2;
    const PARTICIPANT_WEIGHT = 1;

    protected $casts = [
        'strength'                  => 'integer',
        'status'                    => 'integer',
        'participant_count'         => 'integer',
        'listener_count'            => 'integer',
        'voice_participant_count'   => 'integer',
        'video_count'               => 'integer',
        'meeting_count'             => 'integer',
    ];

    /**
     * Find server with the lowest usage
     * @return Server|null
     */
    public static function lowestUsage()
    {
        return self::where('status', ServerStatus::ONLINE)
            // Experimental
            // Have video factor 3, audio factor 2 and just listening factor 1
            ->orderByRaw('((video_count*'.self::VIDEO_WEIGHT.' + voice_participant_count*'.self::AUDIO_WEIGHT.' + (participant_count-voice_participant_count) * '.self::PARTICIPANT_WEIGHT.')/strength) ASC')
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
        return new BigBlueButton($this->base_url, $this->salt);
    }

    /**
     * Get list of currently running meeting from the api
     * @return \BigBlueButton\Core\Meeting[]|null
     */
    public function getMeetings()
    {
        if ($this->status == ServerStatus::DISABLED) {
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

    /**
     * Scope a query to only get servers that have a description like the passed one.
     *
     * @param  Builder $query       Query that should be scoped
     * @param  String  $description Description to search for
     * @return Builder The scoped query
     */
    public function scopeWithDescription(Builder $query, $description)
    {
        return $query->where('description', 'like', '%' . $description . '%');
    }
}
