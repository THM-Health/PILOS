<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserInvitation;
use App\Invitation;
use App\User;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array                                      $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array     $data
     * @return \App\User
     */
    protected function create(array $data)
    {
        return User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    /**
     * Create a new user through invitation register method
     * @param  StoreUserInvitation $request
     * @return JsonResponse
     */
    public function invitationRegister(StoreUserInvitation $request)
    {
        $user = new User();

        $invitation = Invitation::query()
            ->where('invitation_token', $request->invitation_token)
            ->where('email', $request->email)
            ->where('registered_at', null)
            ->first();

        // If invitation data not exist
        if (!$invitation) {
            return response()->json(['message' => Lang::get('validation.custom.request.400')], 400);
        }

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;
        $user->password  = Hash::make($request->password);

        $store = $user->save();

        // Update registered at value to now
        $invitation->registered_at = now();
        $updateInvitation          = $invitation->save();

        return ($store === true && $updateInvitation === true) ? (response()->json($user, 201)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }
}
