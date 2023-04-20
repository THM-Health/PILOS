<?php

namespace App\Auth\OIDC;

use App\Auth\MissingAttributeException;
use App\Auth\RoleMapping;
use App\Http\Controllers\Controller;
use App\Models\SessionData;
use Auth;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class OIDCController extends Controller
{
    public function __construct()
    {
        $this->middleware('guest');
    }

    public function redirect(Request $request)
    {
        if ($request->get('redirect')) {
            $request->session()->put('redirect_url', $request->input('redirect'));
        }

        try {
            return Socialite::driver('oidc')->redirect();
        } catch(NetworkIssue $e) {
            report($e);

            return redirect('/external_login?error=network_issue');
        } catch(InvalidConfiguration $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        }
    }

    public function logout(Request $request)
    {
        if (isset($_REQUEST['logout_token'])) {
            $logout_token = $_REQUEST['logout_token'];

            $claims = Socialite::driver('oidc')->getLogoutTokenClaims($logout_token);

            $lookupSessions = SessionData::where('key', 'oidc_sub')->where('value', $claims->sub)->get();
            foreach ($lookupSessions as $lookupSession) {
                $lookupSession->session()->delete();
            }
        }
    }

    public function callback(Request $request)
    {
        try {
            $oidc_raw_user = Socialite::driver('oidc')->user();
        } catch(NetworkIssue $e) {
            report($e);

            return redirect('/external_login?error=network_issue');
        } catch(InvalidConfiguration $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        } catch(ClientException $e) {
            report($e);

            return redirect('/external_login?error=invalid_configuration');
        } catch(InvalidStateException $e) {
            report($e);

            return redirect('/external_login?error=invalid_state');
        }

        // Create new open-id connect user
        try {
            $oidc_user = new OIDCUser($oidc_raw_user);
        } catch(MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        }
                
        // Get eloquent user (existing or new)
        $oidc_user->createOrFindEloquentModel();

        // Sync attributes
        $oidc_user->syncWithEloquentModel();

        // Save changes (update or create)
        $user = $oidc_user->saveEloquentModel();

        $roleMapping = new RoleMapping();
        $roleMapping->mapRoles($oidc_user->getAttributes(), $user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        session(['session_data' => [
            ['key'=>'oidc_sub', 'value' => $oidc_user->getRawAttributes()['sub']],
        ]]);
        
        session()->put('external_auth', 'oidc');
        session()->put('oidc_id_token', $oidc_raw_user->accessTokenResponseBody['id_token']);
    
        if (config('auth.log.successful')) {
            Log::info('External user '.$user->external_id.' has been successfully authenticated.', ['ip' => $request->ip(), 'user-agent' => $request->header('User-Agent'), 'type' => 'oidc']);
        }

        $url = '/external_login';

        return redirect($request->session()->has('redirect_url') ? ($url.'?redirect='.urlencode($request->session()->get('redirect_url'))) : $url);
    }
}
