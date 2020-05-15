<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{

    protected $dates = ['start','end'];
    protected $fillable = ['id','room_id','start','server_id','parentMeetingID','isBreakout'];
    public $incrementing = false;
    protected $keyType = 'string';
    public function room(){
        return $this->belongsTo(Room::class)->with('owner');
    }



    public function parentMeeting(){
        return $this->belongsTo(Meeting::class,'parentMeetingID');
    }

    public function stats(){
        return $this->hasMany(MeetingStat::class);
    }
}
