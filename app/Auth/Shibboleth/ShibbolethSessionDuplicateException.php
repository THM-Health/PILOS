<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\Shibboleth;

/**
 * Exception thrown when a shibboleth session already exists during a login attempt
 */
class ShibbolethSessionDuplicateException extends \Exception
{
    public function __construct()
    {
        $message = 'Shibboleth session already exists.';
        parent::__construct($message);
    }
}
