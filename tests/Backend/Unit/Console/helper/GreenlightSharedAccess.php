<?php

namespace Tests\Backend\Unit\Console\helper;

class GreenlightSharedAccess
{
    /**
     * GreenlightSharedAccess constructor.
     */
    public function __construct(public $id, public $room_id, public $user_id) {}
}
