<?php

namespace Tests\Backend\Unit\Console\helper;

class GreenlightSharedAccess
{
    public $id;

    public $room_id;

    public $user_id;

    /**
     * GreenlightSharedAccess constructor.
     */
    public function __construct($id, $room_id, $user_id)
    {
        $this->id = $id;
        $this->room_id = $room_id;
        $this->user_id = $user_id;
    }
}
