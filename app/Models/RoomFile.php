<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RoomFile extends Model
{
    use HasFactory;

    /**
     * Room file belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function getLogLabel()
    {
        return $this->filename.' ('.$this->id.')';
    }

    /**
     * Delete file from database and storage
     *
     * @return bool|null
     *
     * @throws \Exception
     */
    #[\Override]
    public function delete()
    {
        $response = parent::delete();
        // if delete successfully
        if ($response) {
            Storage::delete($this->path);
        }

        return $response;
    }

    protected function casts(): array
    {
        return [
            'default' => 'boolean',
            'download' => 'boolean',
            'use_in_meeting' => 'boolean',
        ];
    }
}
