<?php

namespace App\Auth\SAML2;

use App\Auth\ExternalUserService;
use App\Auth\RoleMapping;
use App\Http\Controllers\Controller;
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
use LightSaml\Model\Protocol\NameIDPolicy;
use LightSaml\SamlConstants;

class Saml2Controller extends Controller
{
    public function __construct()
    {
        $this->middleware('guest')->except(['metadata','logout','dologout']);
    }

    public function redirect()
    {

        return Socialite::driver('saml2')->redirect();
    }

    public function metadata()
    {
        $metadata = Socialite::driver('saml2')->getServiceProviderMetadata();
        return $metadata
            ->header('Content-Type', 'text/xml');
    }

    public function callback(Request $request)
    {
        // Create new saml2 user
        $saml_user = new Saml2User(Socialite::driver('saml2')->user());
        
        // Get eloquent user (existing or new)
        $saml_user->createOrFindEloquentModel();

        // Sync attributes
        $saml_user->syncWithEloquentModel();

        // Save changes (update or create)
        $user = $saml_user->saveEloquentModel();

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($saml_user->getAttributes(), $user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        if (config('auth.log.successful')) {
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'saml2']);
        }

        return redirect("/rooms/own");
    }
}
