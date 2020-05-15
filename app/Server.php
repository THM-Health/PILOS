<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use JoisarJignesh\Bigbluebutton\Bbb;

class Server extends Model
{
    public $stats = [];

    public function rooms(){
        return $this->hasMany(Room::class,'preferedServer');
    }

    public function getBBB(){
        return new Bbb(new \JoisarJignesh\Bigbluebutton\Bigbluebutton($this->baseUrl, $this->salt));
    }

    public function getStats(){
        $this->stats = ['online'=>false,'rooms'=>0,'users'=>0,'audio'=>0,'video'=>0];
        if($this->status==0)
            return false;
        $bbb = $this->getBBB();
        try {
            $meetings = $bbb->all();
            $this->online = true;
            $this->stats['online'] = true;
            foreach ($meetings as $meeting){
                $this->stats['rooms']++;
                $this->stats['users']+=$meeting['participantCount'];
                $this->stats['audio']+=$meeting['voiceParticipantCount'];
                $this->stats['video']+=$meeting['videoCount'];
            }
        }
        catch (\Exception $exception){
            dd($exception);
        }
        return $this->stats;
    }

    public function getMeetings(){
        if($this->status==0)
            return null;
        $bbb = $this->getBBB();
        try {
            return $bbb->all();
        }
        catch (\Exception $exception){
            return null;
        }
    }
}
