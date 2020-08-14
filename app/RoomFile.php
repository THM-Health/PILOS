<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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
        $response = parent::delete();
        // if delete successfull
        if ($response) {
            Storage::delete($this->path);
        }

        return $response;
    }

    /**
     * Create download link for bbb usage
     * @return string
     */
    public function bbbDownloadLink()
    {
        return URL::signedRoute('bbb.file', ['room'=>$this->room->id,'roomFile' => $this->id,'filename'=>$this->filename]);
    }
}
