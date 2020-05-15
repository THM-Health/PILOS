<?php

namespace App;

use BigBlueButton\Core\Meeting;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = ['id','name','attendeePW','moderatorPW','user_id'];
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    public function owner(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function shared(){
        return $this->belongsToMany(User::class)->withPivot('moderator');
    }

    public function preferedServer(){
        return $this->belongsTo(Server::class,'preferedServer');
    }




    public function meetings(){
        return $this->hasMany(Meeting::class);
    }



}
