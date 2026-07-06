<?php

declare(strict_types=1);

// Copyright 2020 MITRE
// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace App\Auth\OIDC;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;
use InvalidArgumentException;
use Jose\Component\Checker\AlgorithmChecker;
use Jose\Component\Checker\AudienceChecker;
use Jose\Component\Checker\ClaimCheckerManager;
use Jose\Component\Checker\ExpirationTimeChecker;
use Jose\Component\Checker\HeaderCheckerManager;
use Jose\Component\Checker\InvalidClaimException;
use Jose\Component\Checker\IsEqualChecker;
use Jose\Component\Checker\IssuedAtChecker;
use Jose\Component\Checker\MissingMandatoryClaimException;
use Jose\Component\Core\AlgorithmManagerFactory;
use Jose\Component\Core\JWK;
use Jose\Component\Core\JWKSet;
use Jose\Component\KeyManagement\JWKFactory;
use Jose\Component\Signature\Algorithm\EdDSA;
use Jose\Component\Signature\Algorithm\ES256;
use Jose\Component\Signature\Algorithm\ES384;
use Jose\Component\Signature\Algorithm\ES512;
use Jose\Component\Signature\Algorithm\HS256;
use Jose\Component\Signature\Algorithm\HS384;
use Jose\Component\Signature\Algorithm\HS512;
use Jose\Component\Signature\Algorithm\PS256;
use Jose\Component\Signature\Algorithm\PS384;
use Jose\Component\Signature\Algorithm\PS512;
use Jose\Component\Signature\Algorithm\RS256;
use Jose\Component\Signature\Algorithm\RS384;
use Jose\Component\Signature\Algorithm\RS512;
use Jose\Component\Signature\JWS;
use Jose\Component\Signature\JWSTokenSupport;
use Jose\Component\Signature\JWSVerifier;
use Jose\Component\Signature\Serializer\CompactSerializer;
use JsonException;
use Symfony\Component\Clock\Clock;

class OpenIDConnectClient
{
    /**
     * @var bool Verify SSL peer on transactions
     */
    private bool $verifyPeer = true;

    /**
     * @var string if we acquire an access token it will be stored here
     */
    protected string $accessToken;

    /**
     * @var JWS if we acquire an id token it will be stored here
     */
    protected JWS $idToken;

    /**
     * @var object stores the token response
     */
    private object $tokenResponse;

    /**
     * @var array holds scopes
     */
    private array $scopes = ['openid'];

    /**
     * @var mixed holds well-known openid server properties
     */
    private mixed $wellKnown = false;

    /**
     * @var int timeout (seconds)
     */
    protected int $timeOut = 60;

    /**
     * @var int leeway (seconds)
     */
    private int $leeway = 300;

    /**
     * @var int fallback cache max age (seconds) for openid configuration
     */
    private int $cacheConfigMaxAge = 0;

    /**
     * @var int fallback cache max age (seconds) for jwks
     */
    private int $cacheJwksMaxAge = 0;

    /**
     * @var object holds verified jwt claims
     */
    protected object $verifiedClaims;

    /**
     * @var string if we acquire a sid in back-channel logout it will be stored here
     */
    private ?string $backChannelSid = null;

    /**
     * @var string if we acquire a sub in back-channel logout it will be stored here
     */
    private ?string $backChannelSubject = null;

    /**
     * @var string jti (JWT ID) of back-channel logout it will be stored here
     */
    private string $backChannelJti;

    private AlgorithmManagerFactory $algorithmManagerFactory;

    private CompactSerializer $compactSerializer;

    /**
     * @param  string  $provider_url
     */
    public function __construct(private string $providerUrl, private string $clientID, private string $clientSecret, private string $redirectURL)
    {

        $algorithmManagerFactory = new AlgorithmManagerFactory;
        $algorithmManagerFactory->add('PS256', new PS256);
        $algorithmManagerFactory->add('RS256', new RS256);
        $algorithmManagerFactory->add('PS384', new PS384);
        $algorithmManagerFactory->add('RS384', new RS384);
        $algorithmManagerFactory->add('PS512', new PS512);
        $algorithmManagerFactory->add('RS512', new RS512);
        $algorithmManagerFactory->add('HS256', new HS256);
        $algorithmManagerFactory->add('HS512', new HS512);
        $algorithmManagerFactory->add('HS384', new HS384);
        $algorithmManagerFactory->add('ES256', new ES256);
        $algorithmManagerFactory->add('ES384', new ES384);
        $algorithmManagerFactory->add('ES512', new ES512);
        $algorithmManagerFactory->add('EdDSA', new EdDSA);
        $this->algorithmManagerFactory = $algorithmManagerFactory;

        $this->compactSerializer = new CompactSerializer;
    }

    /**
     * Authenticate the user with the OpenID Connect provider using the authorization code
     *
     * @param  Request  $request  The request object containing the authorization code and state
     *
     * @throws ConnectionException
     * @throws InvalidClaimException
     * @throws JsonException
     * @throws MissingMandatoryClaimException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectCodeMissingException
     * @throws OpenIDConnectNetworkException
     * @throws OpenIDConnectProviderException
     * @throws OpenIDConnectValidationException
     * @throws RequestException
     */
    public function authenticate(Request $request): void
    {
        // Do a preemptive check to see if the provider has thrown an error from a previous redirect
        if ($request->has('error')) {
            $desc = $request->has('error_description') ? ' Description: '.$request->input('error_description') : '';
            throw new OpenIDConnectProviderException('Authentication Error Response: Error: '.$request->input('error').$desc);
        }

        // If the authorization code is missing, the authentication has failed
        // User might have called the authentication URL directly
        if (! $request->has('code')) {
            throw new OpenIDConnectCodeMissingException("Response is missing 'code' parameter.");
        }

        // Check OpenID Connect session
        if (! $request->has('state') || ($request->input('state') !== $this->getState())) {
            throw new OpenIDConnectValidationException('Authentication Response state invalid');
        }

        // Cleanup state
        $this->unsetState();

        // Request token from the server using the code
        $token_json = $this->requestTokens($request->input('code'));

        if (! property_exists($token_json, 'id_token')) {
            throw new OpenIDConnectValidationException('Token Response is missing id_token');
        }

        if (! property_exists($token_json, 'token_type') || Str::lower($token_json->token_type) !== 'bearer') {
            throw new OpenIDConnectValidationException('Token Response token_type is not Bearer');
        }

        if (! property_exists($token_json, 'access_token')) {
            throw new OpenIDConnectValidationException('Token Response is missing access_token');
        }

        $id_token = $token_json->id_token;

        $jws = $this->unserializeJWS($id_token);

        // Verify header
        $this->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::ID_TOKEN);

        // Verify the signature
        $this->verifyJWSSignature($jws);

        // Save the id token
        $this->idToken = $jws;

        // Save the access token
        $this->accessToken = $token_json->access_token;

        // Save the full response
        $this->tokenResponse = $token_json;

        // Get claims from JWT
        $claims = $this->getJWSClaims($jws);

        // Verify the claims in the id token
        $this->verifyIdTokenClaims($claims);

        // Clean up the session a little
        $this->unsetNonce();

        // Save the verified claims
        $this->verifiedClaims = $claims;

        // Success!

    }

    /**
     * Verify each claim in the id token according to the spec
     *
     * @throws InvalidClaimException
     * @throws MissingMandatoryClaimException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     */
    public function verifyIdTokenClaims(object $claims): void
    {
        $clock = new Clock;
        $claimCheckerManager = new ClaimCheckerManager(
            [
                new IssuedAtChecker(clock: $clock, allowedTimeDrift: $this->leeway),
                new ExpirationTimeChecker(clock: $clock, allowedTimeDrift: $this->leeway),
                new AudienceChecker(audience: $this->clientID),
                new IsEqualChecker(key: 'nonce', value: $this->getNonce()),
                new AccessTokenHashChecker($this),
                new IsEqualChecker(key: 'iss', value: $this->getWellKnownConfigValue('issuer')),
            ]
        );

        $claimCheckerManager->check((array) $claims, ['sub', 'aud', 'iss', 'iat', 'exp', 'nonce']);
    }

    /**
     * It calls the end-session endpoint of the OpenID Connect provider to notify the OpenID
     * Connect provider that the end-user has logged out of the relying party site
     * (the client application).
     *
     * @param  string  $idToken  ID token (obtained at login)
     * @param  string|null  $redirect  URL to which the RP is requesting that the End-User's User Agent
     *                                 be redirected after a logout has been performed. The value MUST have been previously
     *                                 registered with the OP. Value can be null.
     *
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     */
    public function getSignOutUrl(string $idToken, string $redirect): string
    {
        $sign_out_endpoint = $this->getWellKnownConfigValue('end_session_endpoint');

        $signout_params = [
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => $redirect,
        ];

        return Uri::of($sign_out_endpoint)->withQuery($signout_params)->value();
    }

    /**
     * Decode and then verify a logout token sent as part of
     * back-channel logout flows.
     *
     * This function should be evaluated as a boolean check
     * in your route that receives the POST request for back-channel
     * logout executed from the OP.
     *
     * @throws OpenIDConnectClientException
     * @throws InvalidArgumentException
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     * @throws InvalidClaimException
     * @throws MissingMandatoryClaimException
     */
    public function verifyLogoutToken(Request $request): void
    {
        // Check if the logout token is present in the request
        if (! $request->has('logout_token')) {
            throw new OpenIDConnectClientException('Back-channel logout: There was no logout_token in the request');
        }

        $logout_token = $request->input('logout_token');

        $jws = $this->unserializeJWS($logout_token);

        // Verify header
        // "Like ID Tokens, selection of the algorithm used is governed by the id_token_signing_alg_values_supported Discovery parameter"
        $this->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::ID_TOKEN);

        // Verify the signature
        $this->verifyJWSSignature($jws);

        // Get claims from JWT
        $claims = $this->getJWSClaims($jws);

        // Verify Logout Token Claims
        $this->verifyLogoutTokenClaims($claims);

        $this->verifiedClaims = $claims;

        // Set the sid, which could be used to map to a session in
        // the RP, and therefore be used to help destroy the RP's
        // session.
        if (isset($claims->sid)) {
            $this->backChannelSid = $claims->sid;
        }

        // Set the sub, which could be used to map to a session in
        // the RP, and therefore be used to help destroy the RP's
        // session.
        if (isset($claims->sub)) {
            $this->backChannelSubject = $claims->sub;
        }

        $this->backChannelJti = $claims->jti;
    }

    /**
     * Verify each claim in the logout token according to the
     * spec for back-channel logout.
     *
     * @throws InvalidClaimException
     * @throws MissingMandatoryClaimException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     */
    public function verifyLogoutTokenClaims(object $claims): void
    {
        $clock = new Clock;
        $claimCheckerManager = new ClaimCheckerManager(
            [
                new IssuedAtChecker(clock: $clock, allowedTimeDrift: $this->leeway),
                new ExpirationTimeChecker(clock: $clock, allowedTimeDrift: $this->leeway),
                new AudienceChecker(audience: $this->clientID),
                new IsEqualChecker(key: 'iss', value: $this->getWellKnownConfigValue('issuer')),
                new EventsChecker('http://schemas.openid.net/event/backchannel-logout'),
            ]
        );

        $claimCheckerManager->check((array) $claims, ['aud', 'iss', 'iat', 'exp', 'events', 'jti']);

        // Verify that the Logout Token doesn't contain a nonce Claim.
        if (isset($claims->nonce)) {
            throw new InvalidClaimException('"nonce" is not allowed.', 'nonce', $claims->nonce);
        }

        // Verify that the logout token contains a sub or sid, or both
        if (! isset($claims->sid) && ! isset($claims->sub)) {
            throw new MissingMandatoryClaimException('The sid or sub claim is required.', array_keys((array) $claims));
        }
    }

    /**
     * @param  array  $scope  - example: given_name, etc...
     */
    public function addScope(array $scope)
    {
        $this->scopes = array_unique(array_merge($this->scopes, $scope));
    }

    /**
     * Gets anything that we need configuration wise including endpoints, and other values
     *
     *
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     */
    public function getWellKnownConfigValue(string $param): mixed
    {
        // If the configuration value is not available, attempt to fetch it from a well-known config endpoint
        // This is also known as auto "discovery"
        if (! $this->wellKnown) {
            $well_known_config_url = Str::finish($this->providerUrl, '/').'.well-known/openid-configuration';

            // If we have the response cached, use it
            if (Cache::has($well_known_config_url)) {
                $this->wellKnown = Cache::get($well_known_config_url);
            } else {
                // Try to fetch the well known configuration
                try {
                    $response = $this->getHttpClient()->get($well_known_config_url)->throw();
                } catch (\Throwable $e) {
                    throw new OpenIDConnectNetworkException('Unable to fetch openid configuration: '.$e->getMessage(), $e->getCode());
                }
                $maxAge = $this->cacheConfigMaxAge;
                if ($response->hasHeader('Cache-Control')) {
                    if (preg_match('/max-age=(\d+)/i', $response->header('Cache-Control'), $matches)) {
                        $maxAge = (int) $matches[1] ?: $maxAge;
                    }
                }

                if (is_object($response->object())) {
                    $this->wellKnown = $response->object();

                    if ($maxAge > 0) {
                        Cache::put($well_known_config_url, $this->wellKnown, $maxAge);
                    }
                } else {
                    throw new OpenIDConnectClientException('The well-known configuration is not a valid JSON object.');
                }

            }
        }

        if (property_exists($this->wellKnown, $param)) {
            return $this->wellKnown->{$param};
        }

        throw new OpenIDConnectClientException("The provider $param could not be fetched. Make sure your provider has a well known configuration available.");
    }

    /**
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     */
    public function getJwkSet(): JWKSet
    {
        $jwksUri = $this->getWellKnownConfigValue('jwks_uri');

        // If we have the response cached, use it
        if (Cache::has($jwksUri)) {
            $jwkSetResponse = Cache::get($jwksUri);
        } else {
            // Try to fetch the jwks
            try {
                $response = $this->getHttpClient()->get($jwksUri)->throw();
            } catch (\Throwable $e) {
                throw new OpenIDConnectNetworkException('Unable to fetch jwks: '.$e->getMessage(), $e->getCode());
            }
            $maxAge = $this->cacheJwksMaxAge;
            if ($response->hasHeader('Cache-Control')) {
                if (preg_match('/max-age=(\d+)/i', $response->header('Cache-Control'), $matches)) {
                    $maxAge = (int) $matches[1] ?: $maxAge;
                }
            }
            if ($maxAge > 0) {
                Cache::put($jwksUri, $response->body(), $maxAge);
            }

            $jwkSetResponse = $response->body();
        }

        return JWKSet::createFromJson($jwkSetResponse);
    }

    /**
     * Create url for authorization request
     *
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     */
    public function getAuthenticationRequestUrl(): string
    {
        $auth_endpoint = $this->getWellKnownConfigValue('authorization_endpoint');

        // Generate and store a nonce in the session
        // The nonce is an arbitrary value
        $nonce = $this->setNonce(Str::random());

        // State essentially acts as a session key for OIDC
        $state = $this->setState(Str::random());

        $auth_params = [
            'response_type' => 'code',
            'redirect_uri' => $this->redirectURL,
            'client_id' => $this->clientID,
            'nonce' => $nonce,
            'state' => $state,
            'scope' => implode(' ', $this->scopes),
        ];

        return Uri::of($auth_endpoint)->withQuery($auth_params)->value();
    }

    /**
     * Requests ID and Access tokens
     *
     * @param  string  $code  authorization code
     *
     * @throws ConnectionException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws RequestException
     * @throws OpenIDConnectProviderException
     */
    protected function requestTokens(string $code): ?object
    {
        $token_endpoint = $this->getWellKnownConfigValue('token_endpoint');

        $token_params = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectURL,
        ];

        // Using client_secret_basic authentication
        try {
            $response = $this->getHttpClient()
                ->withBasicAuth(urlencode($this->clientID), urlencode($this->clientSecret))
                ->asForm()
                ->post($token_endpoint, $token_params);
        } catch (\Throwable $e) {
            throw new OpenIDConnectNetworkException('Unable to fetch tokens '.$e->getMessage(), $e->getCode());
        }

        try {
            $this->tokenResponse = $response->throw()->object();
        } catch (\Throwable $e) {
            throw new OpenIDConnectProviderException('Token Error Response '.$e->getMessage(), $e->getCode());
        }

        return $this->tokenResponse;
    }

    private function getJWK(string $alg, string $key): JWK
    {
        return JWKFactory::createFromSecret(
            $key,
            [
                'alg' => $alg,
                'use' => 'sig',
            ]
        );
    }

    /**
     * Returns the claims from a JWS object
     */
    public function getJWSClaims(JWS $jws): object
    {
        return json_decode($jws->getPayload());
    }

    /**
     * Verifies the JWS signature of a JWS object
     *
     * @param  JWS  $jws  The JWS object to verify
     *
     * @throws OpenIDConnectClientException
     * @throws InvalidArgumentException
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     */
    public function verifyJWSSignature(JWS $jws): void
    {
        $signature = $jws->getSignature(0);
        $alg = $signature->getProtectedHeaderParameter('alg');

        $algorithmManager = $this->algorithmManagerFactory->create([$alg]);
        $jwsVerifier = new JWSVerifier($algorithmManager);

        switch ($alg) {
            case 'PS256':
            case 'RS256':
            case 'PS384':
            case 'RS384':
            case 'PS512':
            case 'RS512':
            case 'ES256':
            case 'ES384':
            case 'ES512':
            case 'EdDSA':

                if ($signature->hasProtectedHeaderParameter('jwk')) {
                    throw new OpenIDConnectClientException('Self signed JWK header is not valid');
                } else {
                    $jwkSet = $this->getJwkSet();

                    $restrictions = [];
                    if ($signature->hasProtectedHeaderParameter('kid')) {
                        $restrictions['kid'] = $signature->getProtectedHeaderParameter('kid');
                    }

                    $jwk = $jwkSet->selectKey('sig', $algorithmManager->get($algorithmManager->list()[0]), $restrictions);
                }
                break;
            case 'HS256':
            case 'HS512':
            case 'HS384':
                $jwk = $this->getJWK($alg, $this->clientSecret);
                break;
            default:
                throw new OpenIDConnectClientException('Unsupported signature algorithm: '.$alg);
        }

        if ($jwk === null) {
            throw new OpenIDConnectClientException('Unable to find JWK for algorithm: '.$alg);
        }

        if (! $jwsVerifier->verifyWithKey($jws, $jwk, 0)) {
            throw new OpenIDConnectValidationException('JWS signature invalid');
        }
    }

    /**
     * Verifies the JWS header of a JWS object
     *
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectNetworkException
     */
    public function verifyJWSHeader(JWS $jws, OpenIDConnectAlgorithmSubset $algSubset): void
    {
        $jwsTokenSupport = new JWSTokenSupport;
        $rpSupportedAlgs = $this->algorithmManagerFactory->aliases();

        $supportedAlgs = [];

        try {
            $opSupportedAlgs = $this->getWellKnownConfigValue($algSubset->value);
            $supportedAlgs = array_intersect($opSupportedAlgs, $rpSupportedAlgs);
        } catch (OpenIDConnectClientException $e) {
            // Discovery document doesn't provide a list of supported signing algorithms
            // we will use all algorithms that we support
            $supportedAlgs = $rpSupportedAlgs;
        }

        try {
            new HeaderCheckerManager(
                [
                    new AlgorithmChecker($supportedAlgs),
                ],
                [
                    $jwsTokenSupport,
                ]
            )->check($jws, 0, ['alg']);
        } catch (\Throwable $e) {
            throw new OpenIDConnectValidationException('Error verifying JWS header: '.$e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * Unserializes a JWS string into a JWS object
     *
     * @throws InvalidArgumentException
     */
    public function unserializeJWS(string $jws): JWS
    {
        return $this->compactSerializer->unserialize($jws);
    }

    /**
     * Serializes a JWS object into a JWS string
     */
    public function serializeJWS(JWS $jws): string
    {
        return $this->compactSerializer->serialize($jws);
    }

    /**
     * Request claims about the End-User from UserInfo Endpoint
     *
     *
     * @throws InvalidClaimException
     * @throws JsonException
     * @throws MissingMandatoryClaimException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectProviderException
     */
    public function requestUserInfo(): object
    {
        $user_info_endpoint = $this->getWellKnownConfigValue('userinfo_endpoint');

        // The accessToken has to be sent in the Authorization header.
        // Accept json to indicate response type
        try {
            $response = $this->getHttpClient()->acceptJson()->withToken($this->accessToken)->get($user_info_endpoint);
        } catch (\Throwable $e) {
            throw new OpenIDConnectNetworkException('Unable to retrieve user data: '.$e->getMessage(), $e->getCode());
        }

        try {
            $body = $response->throw();
        } catch (\Throwable $e) {
            throw new OpenIDConnectProviderException('UserInfo Error Response: '.$e->getMessage(), $e->getCode());
        }

        return $this->getClaimsFromUserInfoResponse($body);
    }

    /**
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     * @throws MissingMandatoryClaimException
     * @throws InvalidClaimException
     */
    private function getClaimsFromUserInfoResponse(Response $response): object
    {
        // When we receive application/jwt, the UserInfo Response is signed and/or encrypted.

        /*
         * The UserInfo Endpoint MUST return a content-type header to indicate which format is being returned.
         * The content-type of the HTTP response MUST be application/json if the response body is a text JSON object; the response body SHOULD be encoded using UTF-8.
         *
         * If the UserInfo Response is signed and/or encrypted, then the Claims are returned in a JWT and the content-type MUST be application/jwt.
         * The response MAY be encrypted without also being signed.
         * If both signing and encryption are requested, the response MUST be signed then encrypted, with the result being a Nested JWT, as defined in [JWT].
         */

        // Extract the content type from the response (remove optional charset)
        $contentTypeHeader = $response->getHeader('Content-Type');
        if (empty($contentTypeHeader)) {
            throw new OpenIDConnectClientException('User data response is missing Content-Type header');
        }

        $contentType = explode(';', $contentTypeHeader[0])[0];

        if ($contentType === 'application/jwt') {
            return $this->getClaimsFromSignedUserInfoResponse($response->body());

        } else {
            return $this->getClaimsFromUnsignedUserInfoResponse($response->body());
        }
    }

    /**
     * @throws JsonException
     * @throws MissingMandatoryClaimException
     * @throws InvalidClaimException
     */
    private function getClaimsFromUnsignedUserInfoResponse($content): object
    {
        $claims = json_decode($content, flags: JSON_THROW_ON_ERROR);

        /*
         * The sub (subject) Claim MUST always be returned in the UserInfo Response.
         * NOTE: Due to the possibility of token substitution attacks (see Section 16.11), the UserInfo Response is not guaranteed to be about the End-User identified by the sub (subject) element of the ID Token.
         * The sub Claim in the UserInfo Response MUST be verified to exactly match the sub Claim in the ID Token; if they do not match, the UserInfo Response values MUST NOT be used.
         */

        new ClaimCheckerManager(
            [
                new IsEqualChecker(key: 'sub', value: $this->getIdTokenPayload()->sub),
            ]
        )->check((array) $claims, ['sub']);

        return $claims;
    }

    /**
     * @throws OpenIDConnectValidationException
     * @throws OpenIDConnectClientException
     * @throws OpenIDConnectNetworkException
     * @throws JsonException
     * @throws InvalidArgumentException
     * @throws MissingMandatoryClaimException
     * @throws InvalidClaimException
     */
    private function getClaimsFromSignedUserInfoResponse(string $jwt): object
    {
        $jws = $this->unserializeJWS($jwt);

        // Verify header
        $this->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::USERINFO);

        // Verify the signature
        $this->verifyJWSSignature($jws);

        // Get claims from JWT
        $claims = $this->getJWSClaims($jws);

        /*
         * The sub (subject) Claim MUST always be returned in the UserInfo Response.
         * NOTE: Due to the possibility of token substitution attacks (see Section 16.11), the UserInfo Response is not guaranteed to be about the End-User identified by the sub (subject) element of the ID Token.
         * The sub Claim in the UserInfo Response MUST be verified to exactly match the sub Claim in the ID Token; if they do not match, the UserInfo Response values MUST NOT be used.
         *
         * If signed, the UserInfo Response MUST contain the Claims iss (issuer) and aud (audience) as members.
         * The iss value MUST be the OP's Issuer Identifier URL. The aud value MUST be or include the RP's Client ID value.
        */

        new ClaimCheckerManager(
            [
                new AudienceChecker($this->clientID),
                new IsEqualChecker(key: 'iss', value: $this->getWellKnownConfigValue('issuer')),
                new IsEqualChecker(key: 'sub', value: $this->getIdTokenPayload()->sub),
            ]
        )->check((array) $claims, ['sub', 'aud', 'iss']);

        return $claims;
    }

    public function getVerifiedClaims(): object
    {
        return $this->verifiedClaims;
    }

    protected function getHttpClient(): PendingRequest
    {
        $client = Http::timeout($this->timeOut);

        if (! $this->verifyPeer) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * @return string|null
     */
    public function getAccessToken()
    {
        return $this->accessToken;
    }

    /**
     * @return JWS|null
     */
    public function getIdToken()
    {
        return $this->idToken;
    }

    /**
     * @return array
     */
    public function getIdTokenHeader()
    {
        return $this->getIdToken()->getSignature(0)->getProtectedHeader();
    }

    /**
     * @return object
     */
    public function getIdTokenPayload()
    {
        return $this->getJWSClaims($this->getIdToken());
    }

    /**
     * Stores nonce
     */
    protected function setNonce(string $nonce): string
    {
        Session::put('openid_connect_nonce', $nonce);

        return $nonce;
    }

    /**
     * Get stored nonce
     *
     * @return string
     */
    protected function getNonce()
    {
        return Session::get('openid_connect_nonce', false);
    }

    /**
     * Cleanup nonce
     *
     * @return void
     */
    protected function unsetNonce()
    {
        Session::remove('openid_connect_nonce');
    }

    /**
     * Stores $state
     */
    protected function setState(string $state): string
    {
        Session::put('openid_connect_state', $state);

        return $state;
    }

    /**
     * Get stored state
     *
     * @return string
     */
    protected function getState()
    {
        return Session::get('openid_connect_state', false);
    }

    /**
     * Cleanup state
     *
     * @return void
     */
    protected function unsetState()
    {
        Session::remove('openid_connect_state');
    }

    /**
     * Set timeout (seconds)
     */
    public function setTimeout(int $timeout)
    {
        $this->timeOut = $timeout;
    }

    public function setLeeway(int $leeway)
    {
        $this->leeway = $leeway;
    }

    public function setVerifyPeer(bool $verifyPeer): void
    {
        $this->verifyPeer = $verifyPeer;
    }

    public function setCacheJwksMaxAge(int $cacheJwksMaxAge): void
    {
        $this->cacheJwksMaxAge = $cacheJwksMaxAge;
    }

    public function setCacheConfigMaxAge(int $cacheConfigMaxAge): void
    {
        $this->cacheConfigMaxAge = $cacheConfigMaxAge;
    }

    public function getSidFromBackChannel(): ?string
    {
        return $this->backChannelSid;
    }

    public function getSubjectFromBackChannel(): ?string
    {
        return $this->backChannelSubject;
    }

    public function getJtiFromBackChannel(): string
    {
        return $this->backChannelJti;
    }

    public function base64url_encode($data)
    {
        // Convert Base64 to Base64URL by replacing "+" with "-" and "/" with "_" and remove tailing "=" if any
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
