<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Session extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $casts = [
        'last_activity' => 'datetime',
    ];

    protected $dateFormat = 'U';

    /**
     * User this session belongs to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionData(): HasMany
    {
        return $this->hasMany(SessionData::class);
    }
}
