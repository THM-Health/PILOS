<?php

namespace App\Models;

use App\Models\Meeting;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recording extends Model
{
    use HasFactory;

    protected $casts = [
        'start'  => 'datetime',
        'end'    => 'datetime'
    ];

    protected $fillable = [
        'start', 'end'
    ];

    /**
     * Meeting
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Meeting
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function formats()
    {
        return $this->hasMany(RecordingFormat::class);
    }
}
