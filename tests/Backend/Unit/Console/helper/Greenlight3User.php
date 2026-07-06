<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit\Console\helper;

class Greenlight3User
{
    public $id;

    public $name;

    public $email;

    public $external_id;

    public $password_digest;

    /**
     * Greenlight3User constructor.
     */
    public function __construct(string $id, string $name, string $email, ?string $external_id, ?string $password_digest)
    {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->external_id = $external_id;
        $this->password_digest = $password_digest;
    }
}
