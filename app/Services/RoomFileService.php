<?php

namespace App\Services;

use App\Models\RoomFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Log;

class RoomFileService
{
    private RoomFile $file;

    private ?int $timeLimit = null;

    public function getTimeLimit(): int
    {
        return $this->timeLimit;
    }

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
        if (! Storage::exists($this->file->path)) {
            try {
                Log::error('Room file {file} not found', ['file' => $this->file->getLogLabel()]);
                $this->file->delete();
            } catch (\Exception $exception) {
            }

            return false;
        }

        return true;
    }

    public function download(): \Illuminate\Http\Response
    {
        Log::info('Download room file {file}', ['file' => $this->file->getLogLabel()]);

        if (! $this->checkFileExists()) {
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/app/'.$this->file->path;
        $fileName = $this->file->filename;
        $fileSize = Storage::size($this->file->path);
        $fileMime = Storage::mimeType($this->file->path);

        return response(null, 200)
            ->header('Content-Type', $fileMime)
            ->header('Content-Length', $fileSize)
            ->header('Content-Disposition', 'inline; filename="'.$fileName.'"')
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('X-Accel-Redirect', $fileAlias);
    }

    /**
     * Create download link
     */
    public function url(): string
    {
        Log::info('Create download url for room file {file}', ['file' => $this->file->getLogLabel()]);
        $params = ['roomFile' => $this->file->id, 'filename' => $this->file->filename];
        $routeName = 'download.file';

        if (! $this->checkFileExists()) {
            abort(404);
        }

        if ($this->timeLimit == null) {
            return URL::signedRoute($routeName, $params);
        }

        return URL::temporarySignedRoute($routeName, now()->addMinutes($this->timeLimit), $params);
    }
}
