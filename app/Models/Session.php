<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $dateFormat = 'U';

    /**
     * User this session belongs to
     *
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

    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
        ];
    }
}
