<?php

namespace App;

use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public $timestamps = false;

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
        $servers = self::where('status', true)->where('offline', false)->get();
        $sorted  = $servers->sortBy(function ($server, $key) {
            return $server->usage();
        });

        return $sorted->first();
    }

    /**
     * Return usage of a server, based on video, audio and participants
     * @return int
     */
    public function usage()
    {
        // Experimental
        // Have video factor 3, audio factor 2 and just listening factor 1
        return ($this->video_count * 3) + $this->voice_participant_count * 2 + ($this->participant_count - $this->voice_participant_count);
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
