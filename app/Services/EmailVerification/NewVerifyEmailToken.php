<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Services\EmailVerification;

use App\Models\VerifyEmail;

class NewVerifyEmailToken
{
    private VerifyEmail $verifyEmail;

    private string $plainTextToken;

    public function __construct(VerifyEmail $verifyEmail, string $plainTextToken)
    {
        $this->verifyEmail = $verifyEmail;
        $this->plainTextToken = $plainTextToken;
    }

    public function getVerifyEmail(): VerifyEmail
    {
        return $this->verifyEmail;
    }

    public function getPlainTextToken(): string
    {
        return $this->plainTextToken;
    }
}
