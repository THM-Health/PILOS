<?php

namespace App\Services\EmailVerification;

use App\Models\VerifyEmail;

class NewVerifyEmailToken
{
    public function __construct(private readonly VerifyEmail $verifyEmail, private readonly string $plainTextToken) {}

    public function getVerifyEmail(): VerifyEmail
    {
        return $this->verifyEmail;
    }

    public function getPlainTextToken(): string
    {
        return $this->plainTextToken;
    }
}
