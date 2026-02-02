<?php

namespace App\Services;

use App\Enums\CustomErrorMessages;
use App\Models\RoomFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Log;

class RoomFileService
{
    private RoomFile $file;

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
            return response(view('new-tab-error', [
                'type' => CustomErrorMessages::ROOM_FILE_NOT_FOUND->value,
                'code' => 404,
                'title' => 'File not found',
                'message' => __('rooms.flash.file_gone'),
            ]))->setStatusCode(404);
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
        $routeName = 'rooms.files.download.bbb';

        if (! $this->checkFileExists()) {
            abort(404);
        }

        return URL::signedRoute($routeName, $params);
    }
}
