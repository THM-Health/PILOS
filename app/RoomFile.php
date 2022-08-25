<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class RoomFile extends Model
{
    protected $casts = [
        'default'            => 'boolean',
        'download'           => 'boolean',
        'use_in_meeting'     => 'boolean',
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
     * Create download link
     * @return string
     */
    public function getDownloadLink($timelimit = null)
    {
        $params = ['roomFile' => $this->id,'filename'=>$this->filename];
        $route  = 'download.file';

        // Handle missing file on drive
        if (!Storage::exists($this->path)) {
            try {
                $this->delete();
            } catch (\Exception $exception) {
            }
            abort(404);
        }

        if ($timelimit == null) {
            return URL::signedRoute($route, $params);
        }

        return URL::temporarySignedRoute($route, now()->addMinutes($timelimit), $params);
    }
}
