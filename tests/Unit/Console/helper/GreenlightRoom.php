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
     */
    public function __construct(string $id, string $user_id, string $name, string $uid, ?int $access_code = null, array $room_settings = [], bool $deleted = false)
    {
        $this->id = $id;
        $this->user_id = $user_id;
        $this->name = $name;
        $this->uid = $uid;
        $this->room_settings = json_encode($room_settings);
        $this->access_code = $access_code;
        $this->deleted = $deleted;
    }
}
