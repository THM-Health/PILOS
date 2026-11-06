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

    /**
     * Normalize a client-provided filename for storage and Content-Disposition.
     *
     * 1) Browsers percent-encode ", CR and LF in multipart filenames during upload
     *
     * "For field names and filenames for file fields, the result of the encoding
     *  in the previous bullet point must be escaped by replacing any 0x0A (LF)
     *  bytes with the byte sequence `%0A`, 0x0D (CR) with `%0D` and 0x22 (")
     *  with `%22`. The user agent must not perform any other escapes."
     *  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
     *
     * 2) Path separators / and \ should be stripped or replaced
     *
     * "Recipients MUST NOT be able to write into any location other than
     *  one to which they are specifically entitled. [...] One strategy
     *  to achieve this is to never trust folder name information in the
     *  filename parameter, for instance by stripping all but the last
     *  path segment and only considering the actual filename (where 'path
     *  segments' are the components of the field value delimited by the
     *  path separator characters "\" and "/").
     *  - https://datatracker.ietf.org/doc/html/rfc6266/#section-4.3
     */
    public static function sanitizeFilename(string $filename): string
    {
        return str_replace(['%22', '%0D', '%0A', '/', '\\', '"', "\r", "\n"], '-', $filename);
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

        $sanitizedFilename = self::sanitizeFilename($this->file->filename);

        // Convert the filename to ASCII and remove any percentage signs.
        // Str::ascii may turn curly quotes into ", which must not remain in the fallback.
        $fallbackFilename = str_replace(['%', '"'], '', Str::ascii($sanitizedFilename));
        $extension = pathinfo($sanitizedFilename, PATHINFO_EXTENSION);

        // If after the conversion, only the extension is left, fallback to _.<extension>
        if ($fallbackFilename === '' || $fallbackFilename === ('.'.$extension)) {
            $fallbackFilename = $extension === '' ? '_' : ('_.'.$extension);
        }

        $response = response(null, 200)
            ->header('Content-Type', $fileMime)
            ->header('Content-Length', $fileSize)
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('X-Accel-Redirect', $fileAlias);

        $response->headers->set(
            'Content-Disposition',
            HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $sanitizedFilename,
                $fallbackFilename
            )
        );

        return $response;
    }
}
