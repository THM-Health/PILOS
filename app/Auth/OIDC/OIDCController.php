<?php

namespace App\Auth\OIDC;

use App\Auth\ExternalUserService;
use App\Auth\RoleMapping;
use App\Http\Controllers\Controller;
use App\Models\ExternalAuthSession;
use App\Models\LookupSession;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Session;

class OIDCController extends Controller
{
    public function __construct()
    {
        $this->middleware('guest');
    }

    public function redirect()
    {
        return Socialite::driver('oidc')->redirect();
    }

    public function logout(Request $request){

        
        if (isset($_REQUEST['logout_token'])) {
            $logout_token = $_REQUEST['logout_token'];

            $claims = Socialite::driver('oidc')->getLogoutTokenClaims($logout_token);

            $lookupSessions = LookupSession::where('key','oidc_sub')->where('value', $claims->sub)->get();	
            foreach ($lookupSessions as $lookupSession) {
                $lookupSession->session()->delete();
            }
        }
    }

    public function callback(Request $request)
    {
        // Create new open-id connect user
        $oidc_user = new OIDCUser(Socialite::driver('oidc')->user());
                
        // Get eloquent user (existing or new)
        $oidc_user->createOrFindEloquentModel();

        // Sync attributes
        $oidc_user->syncWithEloquentModel();

        // Save changes (update or create)
        $user = $oidc_user->saveEloquentModel();

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($oidc_user->getAttributes(),$user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        session(['lookup_data' => ['key'=>'oidc_sub', 'value' => $oidc_user->getRawAttributes()['sub']]]);
    
        if (config('auth.log.successful')) {
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'oidc']);
        }

        return redirect("/rooms/own");

    }
}
