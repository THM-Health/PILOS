<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight2Room
{
    public $id;

    public $user_id;

    public $name;

    public $uid;

    public $bbb_id;

    public $room_settings;

    public $access_code;

    public $deleted;

    /**
     * Greenlight2Room constructor.
     */
    public function __construct(int $id, string $uid, string $bbb_id, string $name, int $user_id, ?string $access_code = null, array $room_settings = [], bool $deleted = false)
    {
        $this->id = $id;
        $this->uid = $uid;
        $this->bbb_id = $bbb_id;
        $this->name = $name;
        $this->user_id = $user_id;
        $this->access_code = $access_code;
        $this->room_settings = json_encode($room_settings);
        $this->deleted = $deleted;
    }
}
