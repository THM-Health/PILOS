<?php

namespace App\Services;

use App\Models\RoomFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class RoomFileService
{
    private RoomFile $file;
    private ?int $timeLimit = null;

    /**
     * @return int
     */
    public function getTimeLimit(): int
    {
        return $this->timeLimit;
    }

    /**
     * @param  int|null        $timeLimit
     * @return RoomFileService
     */
    public function setTimeLimit(?int $timeLimit): self
    {
        $this->timeLimit = $timeLimit;

        return $this;
    }

    public function __construct(RoomFile $file)
    {
        $this->file = $file;
    }

    protected function checkFileExists(): bool
    {
        // Handle missing file on drive
        if (!Storage::exists($this->file->path)) {
            try {
                $this->file->delete();
            } catch (\Exception $exception) {
            }

            return false;
        }

        return true;
    }

    public function download(): \Illuminate\Http\Response
    {
        if (!$this->checkFileExists()) {
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/'.$this->file->path;
        $fileName  = $this->file->filename;
        $fileSize  = Storage::size($this->file->path);
        $fileMime  = Storage::mimeType($this->file->path);

        return response(null, 200)
            ->header('Content-Type', $fileMime)
            ->header('Content-Length', $fileSize )
            ->header('Content-Disposition', 'inline; filename='.$fileName)
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('X-Accel-Redirect', $fileAlias);
    }

    /**
     * Create download link
     * @return string
     */
    public function url(): string
    {
        $params     = ['roomFile' => $this->file->id,'filename'=>$this->file->filename];
        $routeName  = 'download.file';

        if (!$this->checkFileExists()) {
            abort(404);
        }

        if ($this->timeLimit == null) {
            return URL::signedRoute($routeName, $params);
        }

        return URL::temporarySignedRoute($routeName, now()->addMinutes($this->timeLimit), $params);
    }
}
