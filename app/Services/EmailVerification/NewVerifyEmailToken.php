<?php

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
