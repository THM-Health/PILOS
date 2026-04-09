<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight3SharedAccess
{
    public $id;

    public $room_id;

    public $user_id;

    /**
     * Greenlight3SharedAccess constructor.
     */
    public function __construct(string $id, string $room_id, string $user_id)
    {
        $this->id = $id;
        $this->room_id = $room_id;
        $this->user_id = $user_id;
    }
}
