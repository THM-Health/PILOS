<?php

namespace App;

use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public $timestamps = false;

    protected $casts = [
        'offline'    => 'boolean',
        'status'    => 'boolean',
    ];

    /**
     * Get bigbluebutton api instance with the url and secret stored in the database fields
     * @return BigBlueButton
     * @throws \Exception
     */
    public function bbb()
    {
        return new BigBlueButton($this->baseUrl, $this->salt);
    }

    public function getMeetings(){
        if($this->status==0)
            return null;
        try {
            $response = $this->bbb()->getMeetings();
            if($response->failed())
                return null;
            return $response->getMeetings();
        }
        catch (\Exception $exception){
            return null;
        }
    }

    public function stats(){
        return $this->hasMany(ServerStat::class);
    }
}
