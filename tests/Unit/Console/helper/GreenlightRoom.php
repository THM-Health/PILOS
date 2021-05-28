<?php

namespace Tests\Unit\Console\helper;

class GreenlightRoom
{
    public $id;
    public $user_id;
    public $name;
    public $uid;
    public $room_settings;
    public $access_code;
    public $deleted;

    /**
     * GreenlightRoom constructor.
     * @param $id
     * @param $user_id
     * @param $name
     * @param $uid
     * @param int|null $access_code
     * @param array    $room_settings
     * @param bool     $deleted
     */
    public function __construct($id, $user_id, $name, $uid, ?int $access_code = null, array $room_settings = [], bool $deleted = false)
    {
        $this->id              = $id;
        $this->user_id         = $user_id;
        $this->name            = $name;
        $this->uid             = $uid;
        $this->room_settings   = json_encode($room_settings);
        $this->access_code     = $access_code;
        $this->deleted         = $deleted;
    }
}
