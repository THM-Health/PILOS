<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight3Room
{
    public $id;

    public $friendly_id;

    public $user_id;

    public $name;

    public $deleted;

    /**
     * Greenlight3Room constructor.
     */
    public function __construct(string $id, string $friendly_id, string $user_id, string $name, bool $deleted = false)
    {
        $this->id = $id;
        $this->friendly_id = $friendly_id;
        $this->user_id = $user_id;
        $this->name = $name;
        $this->deleted = $deleted;
    }
}
