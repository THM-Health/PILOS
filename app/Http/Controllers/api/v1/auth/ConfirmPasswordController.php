<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\ConfirmsPasswords;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ConfirmPasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Confirm Password Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password confirmations and
    | uses a simple trait to include the behavior. You're free to explore
    | this trait and override any functions that require customization.
    |
    */

    use ConfirmsPasswords;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:users,ldap');
    }

    public function passwordConfirmed()
    {
        return response()->noContent();
    }

    /**
     * Confirm the given user's password.
     *
     * @param  \Illuminate\Http\Request $request
     * @return Response
     * @throws ValidationException
     */
    public function confirm(Request $request)
    {
        $user = Auth::user();

        $credentials = [
            'password' => $request->password
        ];

        if ($user->authenticator === 'ldap') {
            $credentials['uid'] = $user->username;

        } else {
            $credentials['email'] = $user->email;
        }

        if (!Auth::guard($user->authenticator)->validate($credentials)) {
            throw ValidationException::withMessages([
                'password' => [trans('validation.password')],
            ]);
        }

        $this->resetPasswordConfirmationTimeout($request);

        return response()->noContent();
    }
}
