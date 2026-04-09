<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight2Presentation
{
    public $room_id;

    public $key;

    public $filename;

    /**
     * Greenlight2Presentation constructor.
     */
    public function __construct(int $room_id, string $key, string $filename)
    {
        $this->room_id = $room_id;
        $this->key = $key;
        $this->filename = $filename;
    }
}
