<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionData extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['key','value','session_id'];

    public function session()
    {
        return $this->belongsTo(Session::class);
    }
}
