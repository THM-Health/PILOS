<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CustomErrorMessages;
use App\Models\RoomFile;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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

    public function download(): Response
    {
        Log::info('Download room file {file}', ['file' => $this->file->getLogLabel()]);

        if (! $this->checkFileExists()) {
            return response(view('new-tab-error', [
                'type' => CustomErrorMessages::FILE_NOT_FOUND->value,
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
}
