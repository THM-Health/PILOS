<?php

namespace Tests\Unit\Console\helper;

class GreenlightSharedAccess
{
    public $id;
    public $room_id;
    public $user_id;

    /**
     * GreenlightSharedAccess constructor.
     * @param $id
     * @param $room_id
     * @param $user_id
     */
    public function __construct($id, $room_id, $user_id)
    {
        $this->id              = $id;
        $this->room_id         = $room_id;
        $this->user_id         = $user_id;
    }
}
