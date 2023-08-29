<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Foundation\Auth\SendsPasswordResetEmails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends Controller
{
    use SendsPasswordResetEmails;

    /**
     * Send a reset link to the given user.
     *
     * @param  Request      $request
     * @return JsonResponse
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $this->validateEmail($request);

        $user = User::where('authenticator', '=', 'local')
            ->where('initial_password_set', '=', false)
            ->where('email', '=', $request->email)
            ->first();

        if (!empty($user)) {
            $this->broker()->sendResetLink(
                array_merge(['authenticator' => 'local'], $this->credentials($request))
            );
        }

        return response()->json([
            'message' => trans(Password::RESET_LINK_SENT)
        ]);
    }

    /**
     * Get the broker to be used during password reset.
     *
     * @return PasswordBroker
     */
    public function broker(): PasswordBroker
    {
        return Password::broker('users');
    }
}
