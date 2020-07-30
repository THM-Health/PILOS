<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RoomFile extends Model
{
    protected $casts = [
        'default'          => 'boolean',
        'download'         => 'boolean',
        'useinmeeting'     => 'boolean',
    ];

    /**
     * Room file belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Delete file from database and storage
     * @return bool|null
     * @throws \Exception
     */
    public function delete()
    {
        Storage::delete($this->path);

        return parent::delete();
    }
}
