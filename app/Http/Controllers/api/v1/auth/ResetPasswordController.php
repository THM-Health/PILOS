<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\AuthenticationService;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse;
use Laravel\Fortify\Contracts\PasswordResetResponse;

class ResetPasswordController extends Controller
{
    /**
     * Reset the given user's password.
     *
     * @return PasswordResetResponse|FailedPasswordResetResponse
     *
     * @throws ValidationException
     */
    public function reset(ResetPasswordRequest $request)
    {
        $user = User::where('authenticator', '=', 'local')
            ->whereLike('email', $request->email)
            ->first();
        $initial_password_set = $user ? $user->initial_password_set : false;

        $status = $this->broker($initial_password_set ? 'new_users' : 'users')
            ->reset(
                array_merge(['authenticator' => 'local'], $request->only('email', 'password', 'password_confirmation', 'token')),
                function ($user, $password) use ($initial_password_set) {
                    $authService = new AuthenticationService($user);
                    $authService->changePassword($password);
                    $this->guard()->login($user);

                    if ($initial_password_set) {
                        $user->update([
                            'initial_password_set' => false,
                        ]);
                    }
                }
            );

        return $status == Password::PASSWORD_RESET
            ? app(PasswordResetResponse::class, ['status' => $status])
            : app(FailedPasswordResetResponse::class, ['status' => $status]);
    }

    /**
     * Get the broker to be used during password reset.
     */
    public function broker(string $name): PasswordBroker
    {
        return Password::broker($name);
    }

    /**
     * Get the guard to be used during password reset.
     */
    protected function guard(): StatefulGuard
    {
        return Auth::guard('users');
    }
}
