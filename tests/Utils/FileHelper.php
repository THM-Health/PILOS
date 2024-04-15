<?php

namespace Tests\Utils;

class FileHelper
{
    public static function deleteDirectory($dirPath): void
    {
        $files = glob($dirPath.'/*');
        foreach ($files as $file) {
            if (is_dir($file)) {
                self::deleteDirectory($file);
            } else {
                unlink($file);
            }
        }
        rmdir($dirPath);
    }
}
