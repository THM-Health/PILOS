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

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function delete()
    {
        Storage::delete($this->path);

        return parent::delete();
    }
}
