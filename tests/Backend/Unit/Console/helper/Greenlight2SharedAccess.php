<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight2SharedAccess
{
    public $id;

    public $room_id;

    public $user_id;

    /**
     * Greenlight2SharedAccess constructor.
     */
    public function __construct(int $id, int $room_id, int $user_id)
    {
        $this->id = $id;
        $this->room_id = $room_id;
        $this->user_id = $user_id;
    }
}
