<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $keyType   = 'string';
    public $incrementing = false;

    public $timestamps = false;

    protected $casts = [
        'last_activity' => 'datetime',
    ];

    protected $dateFormat = 'U';

    /**
     * User this session belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sessionData()
    {
        return $this->hasMany(SessionData::class);
    }
}
