<?php

namespace App\Auth\OIDC;

use App\Auth\MissingAttributeException;
use App\Http\Controllers\Controller;
use App\Models\SessionData;
use Auth;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        } catch (\Exception $e) {
            Log::error($e);

            return redirect('/external_login?error=openid_connect_exception');
        }

        // Create new open-id connect user


        try {
            $user_info = get_object_vars($this->oidc->requestUserInfo());
            $oidc_user = new OIDCUser($user_info);



        } catch (MissingAttributeException $e) {
            return redirect('/external_login?error=missing_attributes');
        } catch (\Exception $e) {
            return redirect('/external_login?error=openid_connect_exception');
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

        $sessionData = [
            ['key' => 'oidc_sub', 'value' => $user_info['sub']]
        ];

        if(isset($this->oidc->getIdTokenPayload()->sid)){
            $sessionData[] = ['key' => 'oidc_sid', 'value' => $this->oidc->getIdTokenPayload()->sid];
        }

        session(['session_data' => $sessionData]);

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

        try{
            if (! $this->oidc->verifyLogoutToken()) {
                Log::warning('Logout token verification failed');

                throw new \Exception('Failed to verify backchannel logout token');
            }

            $sub = $this->oidc->getSubjectFromBackChannel();
            $sid = $this->oidc->getSidFromBackChannel();

        }
        catch (\Exception $e) {
            Log::error($e);

            return response('', 400)
                ->header('Cache-Control', 'no-store');
        }

        // Destroy the session of the user, if used for frontchannel logout
        $user = Auth::user();
        if ($user) {
            Auth::logout();
        }

        if($sid){
            // If sid is present, delete only the session with that sid

            $lookupSessions = SessionData::where('key', 'oidc_sid')->where('value', $sid)->get();
            foreach ($lookupSessions as $lookupSession) {
                $user = $lookupSession->session->user->getLogLabel();
                Log::info('Deleting session of user {user}', ['user' => $user, 'type' => 'oidc']);
                $lookupSession->session()->delete();
            }
        }
        else {
            // If sid is not present, delete all sessions with that sub

            $lookupSessions = SessionData::where('key', 'oidc_sub')->where('value', $sub)->get();
            foreach ($lookupSessions as $lookupSession) {
                $user = $lookupSession->session->user->getLogLabel();
                Log::info('Deleting session of user {user}', ['user' => $user, 'type' => 'oidc']);
                $lookupSession->session()->delete();
            }
        }

        return response('', 200)
            ->header('Cache-Control', 'no-store');
    }

    /**
     * Frontchannel logout
     */
    public function signout(Request $request)
    {
        $this->oidc->signOut($request->query('id_token'), $request->query('logout_url'));
    }

    public function signoutRedirectURL(string $logout_url)
    {
        if (! $this->oidc->hasEndSessionEndpoint()) {
            return false;
        }

        $params = [
            'id_token' => session('oidc_id_token'),
            'logout_url' => $logout_url,
        ];

        return route('auth.oidc.signout', $params);
    }
}
