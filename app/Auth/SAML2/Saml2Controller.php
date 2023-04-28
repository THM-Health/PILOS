<?php

namespace App\Auth\SAML2;

use App\Auth\MissingAttributeException;
use App\Auth\RoleMapping;
use App\Http\Controllers\Controller;
use App\Models\SessionData;
use Auth;
use ErrorException;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use LightSaml\Error\LightSamlValidationException;

class Saml2Controller extends Controller
{
    public function __construct()
    {
        $this->middleware('guest')->except(['metadata','logout','dologout']);
    }

    public function redirect(Request $request)
    {
        if ($request->post('redirect')) {
            $request->session()->put('redirect_url', $request->input('redirect'));
        }

        try {
            return Socialite::driver('saml2')->redirect();
        } catch(ClientException $e) {
            report($e);

            return redirect('/external_login?error=network_issue');
        } catch(ErrorException $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        }
    }

    public function metadata()
    {
        $metadata = Socialite::driver('saml2')->getServiceProviderMetadata();

        return $metadata
            ->header('Content-Type', 'text/xml');
    }

    public function logout()
    {
        $messageContext = Socialite::driver('saml2')->getLogoutMessageContext();

        if ($messageContext->asLogoutRequest()) {
            $nameId = Socialite::driver('saml2')->getLogoutRequestMessage();

            $lookupSessions = SessionData::where('key', 'saml2_name_id')->where('value', $nameId)->get();
            foreach ($lookupSessions as $lookupSession) {
                $lookupSession->session()->delete();
            }

            return;
        }

        if ($messageContext->asLogoutResponse()) {
            Socialite::driver('saml2')->validateLogoutResponse();

            return redirect('/logout');
        }
    }

    public function callback(Request $request)
    {
        try {
            $saml_raw_user = Socialite::driver('saml2')->user();
        } catch(ClientException $e) {
            report($e);

            return redirect('/external_login?error=network_issue');
        } catch(ErrorException $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        } catch(LightSamlValidationException $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        } catch(InvalidStateException $e) {
            report($e);

            return redirect('/external_login?error=invalid_state');
        }

        // Create new saml2 user
        try {
            $saml_user = new Saml2User($saml_raw_user);
        } catch(MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        }
        
        // Get eloquent user (existing or new)
        $user = $saml_user->createOrFindEloquentModel();

        // Sync attributes
        $saml_user->syncWithEloquentModel();

        // Save changes (update or create)
        $user->save();

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($saml_user, $user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        session(['session_data' => [
            ['key'=>'saml2_name_id', 'value' => $saml_raw_user->id],
        ]]);

        session()->put('external_auth', 'saml2');
        session()->put('saml2_name_id', $saml_raw_user->id);

        if (config('auth.log.successful')) {
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'saml2']);
        }

        $url = '/external_login';

        return redirect($request->session()->has('redirect_url') ? ($url.'?redirect='.urlencode($request->session()->get('redirect_url'))) : $url);
    }
}
