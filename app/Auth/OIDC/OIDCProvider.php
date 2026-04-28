<?php

declare(strict_types=1);

namespace App\Auth\OIDC;

use App\Auth\MissingAttributeException;
use App\Models\SessionData;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Jose\Component\Checker\InvalidClaimException;
use Jose\Component\Checker\MissingMandatoryClaimException;
use JsonException;

class OIDCProvider
{
    public function __construct(private OpenIDConnectClient $openIDConnectClient) {}

    /**
     * Logout url for RP-initiated logout.
     *
     * @param  string  $redirect  URL to redirect the user back to the application
     * @return false|string URL to redirect for logout or false if not available
     */
    public function logout(string $redirect): false|string
    {
        try {
            return $this->openIDConnectClient->getSignOutUrl(session('oidc_id_token'), $redirect);
        } catch (OpenIDConnectClientException $e) {
            // Expected exception when the logout URL is not available / OP does not support logout
            return false;
        } catch (\Throwable $e) {
            Log::error('OIDC logout failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * @throws OpenIDConnectNetworkException
     * @throws OpenIDConnectClientException
     */
    public function redirect($redirect = null)
    {
        if ($redirect) {
            Session::put('redirect_url', $redirect);
        }

        return redirect($this->openIDConnectClient->getAuthenticationRequestUrl());
    }

    /**
     * @throws RequestException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     * @throws OpenIDConnectProviderException
     * @throws OpenIDConnectValidationException
     * @throws ConnectionException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectCodeMissingException
     * @throws MissingAttributeException
     * @throws InvalidClaimException
     * @throws JsonException
     * @throws MissingMandatoryClaimException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws OpenIDConnectValidationException
     */
    public function login(Request $request): User
    {
        $this->openIDConnectClient->authenticate($request);

        $claims = $this->openIDConnectClient->getVerifiedClaims();

        // Create new open-id connect user
        $user_info = get_object_vars($this->openIDConnectClient->requestUserInfo());
        $oidc_user = new OIDCUser($user_info);

        // Get eloquent user (existing or new)
        $user = $oidc_user->createOrFindEloquentModel('oidc');

        // Sync attributes
        $oidc_user->syncWithEloquentModel($user, config('services.oidc.mapping')->roles);

        Auth::login($user);

        $sessionData = [
            ['key' => 'oidc_sub', 'value' => $user_info['sub']],
        ];

        if (isset($claims->sid)) {
            $sessionData[] = ['key' => 'oidc_sid', 'value' => $claims->sid];
        }

        session(['session_data' => $sessionData]);

        session()->put('oidc_id_token', $this->openIDConnectClient->serializeJWS($this->openIDConnectClient->getIdToken()));

        return $user;
    }

    public function backChannelLogout(Request $request): Response
    {
        try {
            $this->openIDConnectClient->verifyLogoutToken($request);

            $claims = $this->openIDConnectClient->getVerifiedClaims();
            $sub = $this->openIDConnectClient->getSubjectFromBackChannel();
            $sid = $this->openIDConnectClient->getSidFromBackChannel();
            $jti = $this->openIDConnectClient->getJtiFromBackChannel();

            $exp = $claims->exp;

            if (Cache::has('oidc-jti-'.$jti)) {
                // Token has already been used
                return response('', 400)
                    ->header('Cache-Control', 'no-store');
            }

            // Store the JTI in cache to prevent replay attacks, until the expiration time of the token
            Cache::put('oidc-jti-'.$jti, true, Carbon::createFromTimestamp($exp));

        } catch (\Throwable $e) {
            Log::error('OIDC back-channel logout failed: '.$e->getMessage());

            return response('', 400)
                ->header('Cache-Control', 'no-store');
        }

        if ($sid) {
            // If sid is present, delete only the session with that sid

            $lookupSessions = SessionData::where('key', 'oidc_sid')->where('value', $sid)->get();
        } else {
            // If sid is not present, delete all sessions with that sub

            $lookupSessions = SessionData::where('key', 'oidc_sub')->where('value', $sub)->get();
        }

        foreach ($lookupSessions as $lookupSession) {
            $user = $lookupSession->session->user;
            if ($user) {
                Log::info('Deleting session of user {user} via OIDC back-channel logout', ['user' => $user->getLogLabel(), 'type' => 'oidc']);
            }
            $lookupSession->session()->delete();
        }

        return response('', 200)
            ->header('Cache-Control', 'no-store');
    }
}
