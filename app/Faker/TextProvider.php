<?php

namespace App\Faker;

use Faker\Provider\Base;

class TextProvider extends Base
{
    /**
     * Returns a string of exactly the given length
     */
    public function textWithLength(int $length): string
    {
        // Generate a text and shorten it to the given length
        // (Words contain at least 1 character so the text has at least the given length)
        $text = substr($this->generator->sentence($length, false), 0, $length);

        // Replace the last character of the text with '.' if it is ' '
        if ($text[$length - 1] === ' ') {
            $text[$length - 1] = '.';
        }

        return $text;
    }
}
