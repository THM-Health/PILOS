<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUser;
use App\Http\Requests\StoreUserInvitation;
use App\Invitation;
use App\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Lang;

class RegisterController extends Controller
{
    /**
     * Create a new user
     * @param  StoreUser    $request
     * @return JsonResponse
     */
    public function register(StoreUser $request)
    {
        $user = new User();

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->username  = $request->username;
        $user->email     = $request->email;
        $user->password  = Hash::make($request->password);

        $store = $user->save();

        return ($store === true) ? (response()->json($user, 201)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }

    /**
     * Create a new user through invitation register method
     * @param  StoreUserInvitation $request
     * @return JsonResponse
     */
    public function invitationRegister(StoreUserInvitation $request)
    {
        $user = new User();

        // Find the invitation record based on requests
        $invitation = Invitation::where([['invitation_token', $request->invitation_token], ['registered_at', null]])->first();

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

        // If save failed
        if (!$store) {
            return response()->json(['message' => Lang::get('validation.custom.request.400')], 400);
        }

        // Update registered at value to current time, make it not reusable anymore
        $invitation->registered_at = now();
        $updateInvitation          = $invitation->save();

        return ($store === true && $updateInvitation === true) ? (response()->json($user, 201)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }
}
