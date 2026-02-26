<?php

namespace Tests\Backend\Unit\Console\helper;

class GreenlightPresentation
{
    public $room_id;

    public $key;

    public $filename;

    /**
     * Greenlight3Presentation constructor.
     */
    public function __construct(string $room_id, string $key, string $filename)
    {
        $this->room_id = $room_id;
        $this->key = $key;
        $this->filename = $filename;
    }
}
