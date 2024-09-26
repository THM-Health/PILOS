<?php

namespace App\Models;

use App\Enums\RecordingAccess;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Storage;

class Recording extends Model
{
    use HasFactory;

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
        'access' => RecordingAccess::class,
    ];

    public function getLogLabel()
    {
        return $this->description.' ['.$this->start->format('Y-m-d H:i').' - '.$this->end->format('Y-m-d H:i').'] ('.$this->id.')';
    }

    /**
     * Room the recording belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Meeting the recording belongs to (if available)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Formats of the recording (screenshare, notes, etc.)
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function formats()
    {
        return $this->hasMany(RecordingFormat::class);
    }

    /**
     * Delete recording from database and storage
     *
     * @return bool|null
     *
     * @throws \Exception
     */
    public function delete()
    {
        $response = parent::delete();
        // if delete successfully
        if ($response) {
            Storage::disk('recordings')->deleteDirectory($this->id);
        }

        return $response;
    }
}
