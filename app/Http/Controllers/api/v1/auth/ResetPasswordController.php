<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Support\Facades\Password as PasswordBrokerFacade;
use App\Rules\Password;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Foundation\Auth\ResetsPasswords;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => ['required', 'string', 'min:8', 'confirmed', new Password()]
        ]);

        $user = User::where('authenticator', '=', 'users')
            ->where('email', '=', $request->email)
            ->first();
        $initial_password_set = $user ? $user->initial_password_set : false;

        $response = $this->broker($initial_password_set ? 'new_users' : 'users')
            ->reset(array_merge(['authenticator' => 'users'], $this->credentials($request)),
                function ($user, $password) use ($initial_password_set) {
                    $this->resetPassword($user, $password);

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
