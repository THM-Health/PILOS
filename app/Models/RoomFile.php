<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RoomFile extends Model
{
    use HasFactory;

    protected $casts = [
        'default' => 'boolean',
        'download' => 'boolean',
        'use_in_meeting' => 'boolean',
    ];

    /**
     * Room file belongs to
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function getLogLabel(): string
    {
        return $this->filename.' ('.$this->id.')';
    }

    /**
     * Delete file from database and storage
     *
     * @throws \Exception
     */
    public function delete(): ?bool
    {
        $response = parent::delete();
        // if delete successfully
        if ($response) {
            Storage::delete($this->path);
        }

        return $response;
    }
}
