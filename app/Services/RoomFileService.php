<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CustomErrorMessages;
use App\Models\RoomFile;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;

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
        $fileSize = Storage::size($this->file->path);
        $fileMime = Storage::mimeType($this->file->path);

        // Sanitize the filename to remove path separators and replace them with hyphens.
        $sanitizedFilename = str_replace(['/', '\\'], '-', $this->file->filename);

        // Convert the filename to ASCII and remove any percentage signs
        $fallbackFilename = str_replace('%', '', Str::ascii($sanitizedFilename));
        $extension = pathinfo($sanitizedFilename, PATHINFO_EXTENSION);

        // If after the conversion, only the extension is left, fallback to _.<extension>
        if ($fallbackFilename === ('.'.$extension)) {
            $fallbackFilename = '_.'.$extension;
        }

        $response = response(null, 200)
            ->header('Content-Type', $fileMime)
            ->header('Content-Length', $fileSize)
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('X-Accel-Redirect', $fileAlias);

        $response->headers->set(
            'Content-Disposition',
            HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_INLINE,
                $sanitizedFilename,
                $fallbackFilename
            )
        );

        return $response;
    }
}
