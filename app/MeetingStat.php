<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MeetingStat extends Model
{
    protected $fillable = ['id','meeting_id','participantCount','listenerCount','voiceParticipantCount','videoCount'];
    public function meeting(){
        return $this->belongsTo(Meeting::class);
    }


}
