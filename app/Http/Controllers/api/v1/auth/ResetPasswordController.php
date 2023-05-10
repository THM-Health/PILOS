<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\Password;
use App\Services\AuthenticationService;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Foundation\Auth\ResetsPasswords;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password as PasswordBrokerFacade;
use Illuminate\Validation\ValidationException;

class ResetPasswordController extends Controller
{
    use ResetsPasswords;

    /**
     * Reset the given user's password.
     *
     * @param  Request                       $request
     * @return RedirectResponse|JsonResponse
     * @throws ValidationException
     */
    public function reset(Request $request)
    {
        // Check if local login is enabled
        if (!config('auth.local.enabled')) {
            abort(404);
        }

        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => ['required', 'string', 'min:8', 'confirmed', new Password()]
        ]);

        $user = User::where('authenticator', '=', 'local')
            ->where('email', '=', $request->email)
            ->first();
        $initial_password_set = $user ? $user->initial_password_set : false;

        $response = $this->broker($initial_password_set ? 'new_users' : 'users')
            ->reset(
                array_merge(['authenticator' => 'local'], $this->credentials($request)),
                function ($user, $password) use ($initial_password_set) {
                    $authService = new AuthenticationService($user);
                    $authService->changePassword($password);
                    $this->guard()->login($user);

                    if ($initial_password_set) {
                        $user->update([
                            'initial_password_set' => false
                        ]);
                    }
                }
            );

        return $response == PasswordBrokerFacade::PASSWORD_RESET
            ? $this->sendResetResponse($request, $response)
            : $this->sendResetFailedResponse($request, $response);
    }

    /**
     * Get the broker to be used during password reset.
     *
     * @param $name
     * @return PasswordBroker
     */
    public function broker($name): PasswordBroker
    {
        return PasswordBrokerFacade::broker($name);
    }

    /**
     * Get the guard to be used during password reset.
     *
     * @return StatefulGuard
     */
    protected function guard(): StatefulGuard
    {
        return Auth::guard('users');
    }
}
