<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUser;
use App\Invitation;
use App\User;
use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    /**
     * Create a new user through invitation register or open register method
     * @param  StoreUser    $request
     * @return UserResource
     */
    public function register(StoreUser $request)
    {
        $user = new User();

        $isPublicRegistration = Config::get('settings.defaults.open_registration');

        // If registration is invitation only, then check the invitation token validity first
        if ($isPublicRegistration === false) {
            $invitation = Invitation::where([['invitation_token', $request->invitation_token], ['registered_at', null]])->first();

            // If invitation data not exist
            if (!$invitation) {
                abort(400);
            }

            // Update registered at value to current time, make it not reusable anymore
            $invitation->registered_at = now();
            $updateInvitation          = $invitation->save();

            if (!$updateInvitation) {
                abort(400);
            }
        }

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;
        $user->password  = Hash::make($request->password);

        // If save failed
        if (!$user->save()) {
            abort(400);
        }

        return new UserResource($user);
    }
}
