<?php

namespace App\Auth\OIDC;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use App\Models\SessionData;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Jumbojett\OpenIDConnectClient;

class OIDCController extends Controller
{
    public function __construct()
    {
        $this->middleware('guest');
        $this->oidc = new OpenIDConnectClient(
            config('services.oidc.issuer'),
            config('services.oidc.client_id'),
            config('services.oidc.client_secret')
        );
        $this->oidc->setRedirectURL(url('/auth/oidc/callback'));
        $this->oidc->addScope(config('services.oidc.scopes'));

        if (config('app.env') == 'local') {
            $this->oidc->setHttpUpgradeInsecureRequests(false);
        }
    }

    public function redirect(Request $request)
    {
        $this->oidc->authenticate();
    }

    public function callback(Request $request)
    {
        try {
            $this->oidc->authenticate();
        } catch (OpenIDConnectClientException $e) {
            Log::error($e);
            return redirect('/external_login');
        }

        // Create new open-id connect user
        try {
            $user_info = get_object_vars($this->oidc->requestUserInfo());
            $oidc_user = new OIDCUser($user_info);
        } catch (MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        }

        // Get eloquent user (existing or new)
        $user = $oidc_user->createOrFindEloquentModel('oidc');

        // Sync attributes
        try {
            $oidc_user->syncWithEloquentModel($user, config('services.oidc.mapping')->roles);
        } catch (MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        }

        Auth::login($user);

        session(['session_data' => [
            ['key' => 'oidc_sub', 'value' => $user_info['sub']],
        ]]);

        session()->put('oidc_id_token', $this->oidc->getIdToken());

        \Log::info('External user {user} has been successfully authenticated.', ['user' => $user->getLogLabel(), 'type' => 'oidc']);

        $url = '/external_login';

        return redirect($request->session()->has('redirect_url') ? ($url.'?redirect='.urlencode($request->session()->get('redirect_url'))) : $url);
    }

    /**
     * Backchannel logout
     */
    public function logout(Request $request)
    {
        Log::debug('OIDC backchannel logout handler called');

        if (!$this->oidc->verifyLogoutToken()) {
            Log::warning('Logout token verification failed');
            return;
        }

        $sub = $this->oidc->getSubjectFromBackChannel();
        if (!isset($sub)) {
            Log::warning('Getting subject from backchannel failed');
            return;
        }

        $lookupSessions = SessionData::where('key', 'oidc_sub')->where('value', $sub)->get();
        foreach ($lookupSessions as $lookupSession) {
            $user = $lookupSession->session->user->getLogLabel();
            Log::info('Deleting session of user {user}', ['user' => $user, 'type' => 'oidc']);
            $lookupSession->session()->delete();
        }
    }

    // FIXME: This is more or less a very ugly reimplementation of
    //        https://github.com/jumbojett/OpenID-Connect-PHP/blob/master/src/OpenIDConnectClient.php#L436
    //        without the redirect at the end and with a hard-coded end_session_endpoint.
    public function logoutRedirectURL()
    {
        $issuer = config('services.oidc.issuer');
        $params = array(
            'client_id' => config('services.oidc.client_id'),
            'id_token_hint' => session('oidc_id_token'),
            'post_logout_redirect_uri' => url('/logout'),
        );
        return "$issuer/protocol/openid-connect/logout?".http_build_query($params);
    }
}
