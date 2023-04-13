<?php

namespace App\Auth\OIDC;

use Cache;
use Exception;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use GuzzleHttp\RequestOptions;
use Http;
use Illuminate\Http\Request;
use SocialiteProviders\Manager\OAuth2\AbstractProvider;
use SocialiteProviders\Manager\OAuth2\User;

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
        return ['issuer', 'ttl', 'scopes'];
    }

    protected function getOIDCConfig($key)
    {
        $url = rtrim($this->getConfig('issuer'), '/').'/.well-known/openid-configuration';

        $cacheKey = 'oidc.config.'.md5($url);
        $config = Cache::get($cacheKey);

        if (! $config) {
            try {
                $response = Http::get($url);
            } catch (Exception $e) {
                throw new NetworkIssue($e);
            }

            if ($response->successful()) {
                $config = $response->json();
                Cache::put($cacheKey, $config, $seconds = $this->getConfig('ttl'));
            } else {
                throw new InvalidConfiguration();
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
            $claims = JWT::decode($logoutToken, JWK::parseKeySet($this->getJWTKeys(), 'RS256'));

            $payload = explode('.', $logoutToken);
            $headerRaw = JWT::urlsafeB64Decode($payload[0]);
            $header = JWT::jsonDecode($headerRaw);

            // Get the supported algorithms, fallback to RS256
            $supportedAlgs = $this->getOIDCConfig('id_token_signing_alg_values_supported') ?? ['RS256'];
            // Get the alg from the header
            $alg = $header->alg;

            // Validate the alg (algorithm) Header Parameter
            // https://openid.net/specs/openid-connect-backchannel-1_0.html
            if (! in_array($alg, $supportedAlgs)) {
                throw new Exception('Unsupported alg '.$alg.' header, supported algorithms are '.implode(', ', $supportedAlgs));
            }
            if ($alg === 'none') {
                throw new Exception('Unsupported alg none');
            }

            if ($this->verifyLogoutTokenClaims($claims)) {
                return $claims;
            }
        } catch (Exception $ex) {
            return false;
        }

        return false;
    }

    private function verifyLogoutTokenClaims($claims)
    {
        // Verify that the Logout Token doesn't contain a nonce Claim.
        if (isset($claims->nonce)) {
            return false;
        }

        // Verify that the logout token contains the sub
        if (! isset($claims->sub)) {
            return false;
        }

        // Verify that the Logout Token contains an events Claim whose
        // value is a JSON object containing the member name
        // https://openid.net/specs/openid-connect-backchannel-1_0.html
        if (isset($claims->events)) {
            $events = (array) $claims->events;
            if (! isset($events['http://schemas.openid.net/event/backchannel-logout']) ||
                ! is_object($events['http://schemas.openid.net/event/backchannel-logout'])) {
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
        $auds = is_array($auds) ? $auds : [$auds];
        if (! in_array($this->config['client_id'], $auds, true)) {
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
            'grant_type' => 'authorization_code',
        ]);
    }

    public function logout($idToken, $redirect)
    {
        $signout_endpoint = $this->getOIDCConfig('end_session_endpoint');

        if (! $signout_endpoint) {
            return false;
        }

        $signout_params = [
            'client_id' => $this->config['client_id'],
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => $redirect,
        ];

        $signout_endpoint .= (strpos($signout_endpoint, '?') === false ? '?' : '&').http_build_query($signout_params, '', '&');

        return $signout_endpoint;
    }
}
