<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Models\User;
use App\Settings\UserSettings;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends Controller
{
    /**
     * Send a reset link to the given user.
     */
    public function sendResetLinkEmail(ForgotPasswordRequest $request): JsonResponse
    {
        if (! app(UserSettings::class)->password_change_allowed) {
            abort(404);
        }

        $user = User::where('authenticator', '=', 'local')
            ->where('initial_password_set', '=', false)
            ->whereLike('email', $request->email)
            ->first();

        if (! empty($user)) {
            $this->broker()->sendResetLink(['authenticator' => 'local', 'email' => $request->email]);
        }

        return response()->json([
            'message' => trans(Password::RESET_LINK_SENT),
        ]);
    }

    /**
     * Get the broker to be used during password reset.
     */
    public function broker(): PasswordBroker
    {
        return Password::broker('users');
    }
}
