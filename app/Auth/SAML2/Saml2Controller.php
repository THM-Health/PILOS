<?php

namespace App\Auth\SAML2;

use App\Auth\ExternalUserService;
use App\Auth\RoleMapping;
use App\Http\Controllers\Controller;
use App\Models\SessionData;
use Auth;
use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use LightSaml\Helper;
use LightSaml\Model\Assertion\Issuer;
use LightSaml\Model\Assertion\NameID;
use LightSaml\Model\Context\SerializationContext;
use LightSaml\Model\Protocol\LogoutRequest;
use LightSaml\Model\Protocol\LogoutResponse;
use LightSaml\Model\Protocol\NameIDPolicy;
use LightSaml\SamlConstants;

class Saml2Controller extends Controller
{
    public function __construct()
    {
        $this->middleware('guest')->except(['metadata','logout','dologout']);
    }

    public function redirect(Request $request)
    {
        if($request->get('redirect')){
            $request->session()->put('redirect_url', $request->input('redirect'));
        }

        return Socialite::driver('saml2')->redirect();
    }

    public function metadata()
    {
        $metadata = Socialite::driver('saml2')->getServiceProviderMetadata();
        return $metadata
            ->header('Content-Type', 'text/xml');
    }

    public function logout(){

        $messageContext = Socialite::driver('saml2')->getLogoutMessageContext();

        if ($messageContext->asLogoutRequest()) {
            $nameId = Socialite::driver('saml2')->getLogoutRequestMessage();

            $lookupSessions = SessionData::where('key','saml2_name_id')->where('value', $nameId)->get();	
            foreach ($lookupSessions as $lookupSession) {
                $lookupSession->session()->delete();
            }
            return;
        }

        if ($messageContext->asLogoutResponse()) {
            Socialite::driver('saml2')->validateLogoutResponse();
            return redirect("/logout");
        }
    }

    public function callback(Request $request)
    {
        $saml_raw_user = Socialite::driver('saml2')->user();

        // Create new saml2 user
        $saml_user = new Saml2User($saml_raw_user);
        
        // Get eloquent user (existing or new)
        $saml_user->createOrFindEloquentModel();

        // Sync attributes
        $saml_user->syncWithEloquentModel();

        // Save changes (update or create)
        $user = $saml_user->saveEloquentModel();

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($saml_user->getAttributes(), $user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        session(['session_data' => [
            ['key'=>'saml2_name_id', 'value' => $saml_raw_user->id],
        ]]); 

        session()->put('external_auth', 'saml2');
        session()->put('saml2_name_id', $saml_raw_user->id);

        if (config('auth.log.successful')) {
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'saml2']);
        }

        $url = "/external_login";
        return redirect($request->session()->has('redirect_url') ? ($url."?redirect=".urlencode($request->session()->get('redirect_url'))) : $url);
    }
}
