<?php

namespace App\Auth\OIDC;

use Cache;
use Exception;
use GuzzleHttp\RequestOptions;
use Http;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Laravel\Socialite\Two\InvalidStateException;
use SocialiteProviders\Manager\OAuth2\AbstractProvider;
use SocialiteProviders\Manager\OAuth2\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;

class OIDCProvider extends AbstractProvider
{
    public const IDENTIFIER = 'OIDC';

    protected $scopeSeparator = ' ';

    protected $scopes = ['openid'];

    public function __construct(Request $request, $clientId, $clientSecret, $redirectUrl, $guzzle = [])
    {
        parent::__construct($request, $clientId, $clientSecret, $redirectUrl, $guzzle);
    }

    /**
     * {@inheritdoc}
     */
    public static function additionalConfigKeys()
    {
        return ['issuer','ttl','scopes'];
    }

    protected function getOIDCConfig($key)
    {
        $url = rtrim($this->getConfig('issuer'), '/')."/.well-known/openid-configuration";

        $cacheKey = 'oidc.config.'.md5($url);
        $config = Cache::get($cacheKey);

        if(!$config) {
            $response = Http::get($url);
            $config = $response->json();
            if ($response->successful()) {
                Cache::put($cacheKey, $config, $seconds = $this->getConfig('ttl'));
            }
        }

        $this->redirectUrl = url($this->getConfig('redirect'));

        return $config[$key] ?? null;
    }

    /**
     * Get public keys
     *
     * @return array
     */
    private function getJWTKeys()
    {
        $response = Http::get($this->getOIDCConfig('jwks_uri'));

        return $response->json();
    }

    public function getLogoutTokenClaims($logoutToken)
    {
        try {
            // payload validation
            $payload = explode('.', $logoutToken);
            $payloadJson = json_decode(base64_decode(str_pad(strtr($payload[1], '-_', '+/'), strlen($payload[1]) % 4, '=', STR_PAD_RIGHT)), true);

            $claims = JWT::decode($logoutToken, JWK::parseKeySet($this->getJWTKeys(), 'RS256'), $this->getOIDCConfig('id_token_signing_alg_values_supported'));

            if($this->verifyLogoutTokenClaims($claims)){
                return $claims;
            }
        } catch (Exception $ex) {
            return false;
        }

        return false;
    }

    private function verifyLogoutTokenClaims($claims){
        // Verify that the Logout Token doesn't contain a nonce Claim.
        if (isset($claims->nonce)) {
            return false;
        }

        // Verify that the logout token contains the sub
        if ( !isset($claims->sub)) {
            return false;
        }

        // Verify that the Logout Token contains an events Claim whose
        // value is a JSON object containing the member name
        // http://schemas.openid.net/event/backchannel-logout
        if (isset($claims->events)) {
            $events = (array) $claims->events;
            if (!isset($events['http://schemas.openid.net/event/backchannel-logout']) ||
                !is_object($events['http://schemas.openid.net/event/backchannel-logout'])) {
                return false;
            }
        } else {
            return false;
        }

        // Validate the iss
        if (strcmp($claims->iss, $this->getOIDCConfig('issuer'))) {
            return false;
        }

        // Validate the aud
        $auds = $claims->aud;
        $auds = is_array( $auds ) ? $auds : [ $auds ];
        if (!in_array($this->config['client_id'], $auds, true)) {
            return false;
        }

        // Validate the iat. At this point we can return true if it is ok
        if (!isset($claims->iat) || !((is_int($claims->iat)) && ($claims->iat <= time() + 300))) {
            return false;
        }

        return true;
    }


    /**
     * {@inheritdoc}
     */
    protected function getAuthUrl($state)
    {
        $this->setScopes(array_merge($this->scopes, $this->getConfig('scopes')));

        return $this->buildAuthUrlFromBase($this->getOIDCConfig('authorization_endpoint'), $state);
    }

    /**
     * {@inheritdoc}
     */
    protected function getTokenUrl()
    {
        return $this->getOIDCConfig('token_endpoint');
    }

    /**
     * {@inheritdoc}
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get($this->getOIDCConfig('userinfo_endpoint'), [
            RequestOptions::HEADERS => [
                'Authorization' => 'Bearer '.$token,
            ],
        ]);

        return json_decode((string) $response->getBody(), true);
    }

    /**
     * {@inheritdoc}
     */
    protected function mapUserToObject(array $user)
    {
        return (new User())->setRaw($user);
    }

    /**
     * {@inheritdoc}
     */
    protected function getTokenFields($code)
    {
        return array_merge(parent::getTokenFields($code), [
            'grant_type' => 'authorization_code'
        ]);
    }


    public function logout($idToken, $redirect){
        $signout_endpoint = $this->getOIDCConfig('end_session_endpoint');

      
       if(!$signout_endpoint){
            return false;
        }

        $signout_params = [
            'client_id' => $this->config['client_id'],
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => $redirect,
        ];

        $signout_endpoint  .= (strpos($signout_endpoint, '?') === false ? '?' : '&') . http_build_query( $signout_params, '', '&');
        return $signout_endpoint;
    }
}
