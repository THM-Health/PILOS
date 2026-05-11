<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight3Room
{
    public $id;

    public $friendly_id;

    public $meeting_id;

    public $user_id;

    public $name;

    /**
     * Greenlight3Room constructor.
     */
    public function __construct(string $id, string $friendly_id, string $meeting_id, string $name, string $user_id)
    {
        $this->id = $id;
        $this->friendly_id = $friendly_id;
        $this->meeting_id = $meeting_id;
        $this->name = $name;
        $this->user_id = $user_id;
    }
}
