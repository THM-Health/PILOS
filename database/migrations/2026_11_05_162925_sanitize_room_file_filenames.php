<?php

declare(strict_types=1);

use App\Models\RoomFile;
use App\Services\RoomFileService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Rewrites filenames that contain characters that are handled differently in the Content-Disposition header
     * by browsers
     */
    public function up(): void
    {
        RoomFile::query()
            ->where(function (Builder $query) {
                foreach (['%22', '%0D', '%0A', '/', '\\', '"', "\r", "\n"] as $needle) {
                    $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $needle);
                    $query->orWhereRaw('filename LIKE ? ESCAPE ?', ['%'.$escaped.'%', '\\']);
                }
            })
            ->eachById(function (RoomFile $file) {
                $sanitized = RoomFileService::sanitizeFilename($file->filename);

                if ($sanitized === $file->filename) {
                    return;
                }

                $file->filename = $sanitized;
                $file->save();
            });
    }
};
