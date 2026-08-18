<?php

declare(strict_types=1);

namespace App\Rules;

use Illuminate\Validation\Rules\File;

class Image extends File
{
    public static function default(): Image
    {
        return self::types(['jpg', 'png', 'gif', 'svg', 'webp', 'bmp'])
            ->extensions(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp']);
    }

    public static function logo(): Image
    {
        return self::default()
            ->max('500kb'); // larger files are bad for loading times
    }

    public static function favicon(): Image
    {
        return self::types(['ico'])
            ->extensions(['ico'])
            ->max('500kb'); // larger files are bad for loading times
    }
}
