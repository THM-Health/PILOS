<?php

declare(strict_types=1);

namespace Tests\Backend\Utils;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

trait ZipHelper
{
    public function assertZipFilesEqual($expected, $actual): void
    {
        // Create fake disk and directory
        $disk = Storage::fake('testing');
        $disk->makeDirectory('zip');

        // Copy files into fake disk
        copy($expected, $disk->path('zip/expected.zip'));
        copy($actual, $disk->path('zip/actual.zip'));

        // Unpack the zip files
        $this->unpackZipFile($disk->path('zip/expected.zip'), $disk->path('zip/expected'));
        $this->unpackZipFile($disk->path('zip/actual.zip'), $disk->path('zip/actual'));

        // Create list of content and compare
        // allFiles is an absolute path, so we have to remove the path to get the relative path of the files in the zip
        $filesExpected = Arr::map($disk->allFiles('zip/expected'), function ($file) {
            return str_replace('zip/expected/', '', $file);
        });
        $filesActual = Arr::map($disk->allFiles('zip/actual'), function ($file) {
            return str_replace('zip/actual/', '', $file);
        });
        $this->assertEquals($filesExpected, $filesActual);

        // Compare the files content
        foreach ($filesExpected as $file) {
            $this->assertEquals($disk->get('zip/expected/'.$file), $disk->get('zip/actual/'.$file));
        }

        // Cleanup
        $disk->deleteDirectory('zip');
    }

    public function unpackZipFile($file, $dir)
    {
        $zip = new \ZipArchive;
        if ($zip->open($file) === true) {
            $zip->extractTo($dir);
            $zip->close();
        } else {
            throw new \Exception("Can't open zip file '$file'");
        }
    }
}
