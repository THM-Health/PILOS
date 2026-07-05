<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit;

use App\Auth\OIDC\OpenIDConnectAlgorithmSubset;
use App\Auth\OIDC\OpenIDConnectClient;
use App\Auth\OIDC\OpenIDConnectClientException;
use App\Auth\OIDC\OpenIDConnectNetworkException;
use App\Auth\OIDC\OpenIDConnectValidationException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Jose\Component\KeyManagement\JWKFactory;
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
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\JWTTestHelpers;

class OpenIDConnectClientTest extends TestCase
{
    use JWTTestHelpers;

    private $discovery = [
        'issuer' => 'https://example.org',
        'authorization_endpoint' => 'https://example.org/authorize',
        'token_endpoint' => 'https://example.org/token',
        'userinfo_endpoint' => 'https://example.org/userinfo',
        'jwks_uri' => 'https://example.org/jwks',
        'response_types_supported' => ['code', 'id_token'],
        'subject_types_supported' => ['public'],
        'id_token_signing_alg_values_supported' => ['RS256'],
    ];

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function assertVerifyJWSSignatureException(OpenIDConnectClient $client, JWS $jws, string $expectedException): void
    {
        $thrownException = null;
        try {
            $client->verifyJWSSignature($jws);
        } catch (\Throwable $e) {
            $thrownException = get_class($e);
        }
        $this->assertEquals($expectedException, $thrownException, "VerifyJWSSignature should throw an exception of type $expectedException, but got: $thrownException");
    }

    public function assertVerifyJWSSignatureNoException(OpenIDConnectClient $client, JWS $jws): void
    {
        $thrownException = null;
        try {
            $client->verifyJWSSignature($jws);
        } catch (\Throwable $e) {
            $thrownException = get_class($e);
        }
        $this->assertNull($thrownException, "VerifyJWSSignature should not throw an exception, but got: $thrownException");
    }

    public function test_verify_jwt_signature_with_rsassa()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        // Create a new RSA key pairs for signing the ID token
        $pkRS256 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $kidRS256 = bin2hex(random_bytes(6));

        $pkRS384 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS384',
                'use' => 'sig',
            ]
        );
        $kidRS384 = bin2hex(random_bytes(6));

        $pkRS512 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS512',
                'use' => 'sig',
            ]
        );
        $kidRS512 = bin2hex(random_bytes(6));

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [
            [
                'kid' => $kidRS256,
                ...$pkRS256->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidRS384,
                ...$pkRS384->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidRS512,
                ...$pkRS512->toPublic()->jsonSerialize(),
            ],
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');

        // RS256
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkRS256, 'RS256', ['kid' => $kidRS256]));

        // RS384
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkRS384, 'RS384', ['kid' => $kidRS384]));

        // RS512
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkRS512, 'RS512', ['kid' => $kidRS512]));

        // Without kid
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkRS256, 'RS256'));

        // With wrong kid
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkRS256, 'RS256', ['kid' => 'wrong-kid']), OpenIDConnectClientException::class);

        // With invalid signature
        $pkRS256 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkRS256, 'RS256', ['kid' => $kidRS256]), OpenIDConnectValidationException::class);

    }

    public function test_verify_jwt_signature_with_rsass_a_pss()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        // Create a new RSA key pairs for signing the ID token
        $pkPS256 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'PS256',
                'use' => 'sig',
            ]
        );
        $kidPS256 = bin2hex(random_bytes(6));

        $pkPS384 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'PS384',
                'use' => 'sig',
            ]
        );
        $kidPS384 = bin2hex(random_bytes(6));

        $pkPS512 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'PS512',
                'use' => 'sig',
            ]
        );
        $kidPS512 = bin2hex(random_bytes(6));

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [
            [
                'kid' => $kidPS256,
                ...$pkPS256->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidPS384,
                ...$pkPS384->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidPS512,
                ...$pkPS512->toPublic()->jsonSerialize(),
            ],
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');

        // PS256
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkPS256, 'PS256', ['kid' => $kidPS256]));

        // PS384
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkPS384, 'PS384', ['kid' => $kidPS384]));

        // PS512
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkPS512, 'PS512', ['kid' => $kidPS512]));

        // Without kid
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkPS256, 'PS256'));

        // With wrong kid
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkPS256, 'PS256', ['kid' => 'wrong-kid']), OpenIDConnectClientException::class);

        // With invalid signature
        $pkPS256 = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'PS256',
                'use' => 'sig',
            ]
        );
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkPS256, 'PS256', ['kid' => $kidPS256]), OpenIDConnectValidationException::class);
    }

    public function test_verify_jwt_signature_with_ecdsa()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        // Create a new elliptic curve key pairs for signing the ID token
        $pkES256 = JWKFactory::createECKey('P-256');
        $kidES256 = bin2hex(random_bytes(6));

        $pkES384 = JWKFactory::createECKey('P-384');
        $kidES384 = bin2hex(random_bytes(6));

        $pkES512 = JWKFactory::createECKey('P-521');
        $kidES512 = bin2hex(random_bytes(6));

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [
            [
                'kid' => $kidES256,
                ...$pkES256->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidES384,
                ...$pkES384->toPublic()->jsonSerialize(),
            ],
            [
                'kid' => $kidES512,
                ...$pkES512->toPublic()->jsonSerialize(),
            ],
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');

        // ES256
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkES256, 'ES256', ['kid' => $kidES256]));

        // ES384
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkES384, 'ES384', ['kid' => $kidES384]));

        // ES512
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkES512, 'ES512', ['kid' => $kidES512]));

        // Without kid
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkES256, 'ES256'));

        // With wrong kid
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkES256, 'ES256', ['kid' => 'wrong-kid']), OpenIDConnectClientException::class);

        // With invalid signature
        $pkES256 = JWKFactory::createECKey('P-256');
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkES256, 'ES256', ['kid' => $kidES256]), OpenIDConnectValidationException::class);

    }

    public function test_verify_jwt_signature_with_ed_dsa()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        // Create octet key pair for signing the ID token
        $pkEd25519 = JWKFactory::createOKPKey('Ed25519');
        $kidEd25519 = bin2hex(random_bytes(6));

        // List of JWKs to be returned by the JWKS endpoint
        $jwks = [
            [
                'kid' => $kidEd25519,
                ...$pkEd25519->toPublic()->jsonSerialize(),
            ],
        ];

        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
            'https://example.org/jwks' => Http::response([
                'keys' => $jwks,
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');

        // Ed25519
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkEd25519, 'EdDSA', ['kid' => $kidEd25519]));

        // Without kid
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $pkEd25519, 'EdDSA'));

        // With wrong kid
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkEd25519, 'EdDSA', ['kid' => 'wrong-kid']), OpenIDConnectClientException::class);

        // With invalid signature
        $pkEd25519 = JWKFactory::createOKPKey('Ed25519');
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $pkEd25519, 'EdDSA', ['kid' => $kidEd25519]), OpenIDConnectValidationException::class);

    }

    public function test_verify_jwt_signature_with_hmac()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        $clientSecret = bin2hex(random_bytes(32));

        $keyHS256 = JWKFactory::createFromSecret(
            $clientSecret,
            [
                'alg' => 'HS256',
                'use' => 'sig',
            ]
        );
        $keyHS384 = JWKFactory::createFromSecret(
            $clientSecret,
            [
                'alg' => 'HS384',
                'use' => 'sig',
            ]
        );
        $keyHS512 = JWKFactory::createFromSecret(
            $clientSecret,
            [
                'alg' => 'HS512',
                'use' => 'sig',
            ]
        );

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', $clientSecret, 'https://localhost/callback');

        // HS256
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $keyHS256, 'HS256'));

        // HS384
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $keyHS384, 'HS384'));

        // HS512
        $this->assertVerifyJWSSignatureNoException($client, $this->createJWS(['sub' => 'test'], $keyHS512, 'HS512'));

        // With invalid signature
        $wrongKeyHS256 = JWKFactory::createFromSecret(
            bin2hex(random_bytes(32)),
            [
                'alg' => 'HS256',
                'use' => 'sig',
            ]
        );
        $this->assertVerifyJWSSignatureException($client, $this->createJWS(['sub' => 'test'], $wrongKeyHS256, 'HS256'), OpenIDConnectValidationException::class);
    }

    #[DataProvider('provideTestVerifyIdTokenClaimsData')]
    public function test_verify_id_token_claims($claims, $idToken, $accessToken, $expectedResult)
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        $client = $this->getStubBuilder(OpenIDConnectClient::class)
            ->setConstructorArgs(['https://example.org',
                'fake-client-id',
                'fake-client-secret',
                'https://localhost/callback'])
            ->onlyMethods(['getIdToken', 'getAccessToken'])
            ->getStub();

        $idTokenJWS = $client->unserializeJWS($idToken);

        $client->method('getIdToken')->willReturn($idTokenJWS);
        $client->method('getAccessToken')->willReturn($accessToken);

        Session::put('openid_connect_nonce', 'nonce-123');

        $actualResult = true;
        try {
            $client->verifyIdTokenClaims($claims);
        } catch (\Throwable $exception) {
            $actualResult = false;
        }

        $this->assertEquals($expectedResult, $actualResult);
    }

    public static function provideTestVerifyIdTokenClaimsData(): array
    {
        // Token and access token from https://openid.net/specs/openid-connect-core-1_0.html#id_token-tokenExample
        $idToken = 'eyJraWQiOiIxZTlnZGs3IiwiYWxnIjoiUlMyNTYifQ.ewogImlzcyI6ICJodHRwczovL3NlcnZlci5leGFtcGxlLmNvbSIsCiAic3ViIjogIjI0ODI4OTc2MTAwMSIsCiAiYXVkIjogInM2QmhkUmtxdDMiLAogIm5vbmNlIjogIm4tMFM2X1d6QTJNaiIsCiAiZXhwIjogMTMxMTI4MTk3MCwKICJpYXQiOiAxMzExMjgwOTcwLAogImF0X2hhc2giOiAiNzdRbVVQdGpQZnpXdEYyQW5wSzlSUSIKfQ.kdqTmftlaXg5WBYBr1wkxhkqCGZPc0k8vTiV5g2jj67jQ7XkrDamYx2bOkZLdZrpMPIzkdYB1nZI_G8vQGQuamRhJcEIt21kblGPZ-yhEhdkAiZIZLu38rChalDS2Mh0glE_rke5XXRhmqqoEFFdziFdnO3p61-7y51co84OEAZvARSINQaOWIzvioRfs4zwIFOaT33Vpxfqr8HDyh31zo9eBW2dSQuCa071z0ENWChWoPliK1JCo_Bk9eDg2uwo2ZwhsvHzj6TMQ0lYOTzufSlSmXIKfjlOsb3nftQeR697_hA-nMZyAdL8_NRfaC37XnAbW8WB9wCfECp7cuNuOg';
        $accessToken = 'jHkWEdUXMU1BwAsC4vtUsZwnNvTIxEl0z9K3vx5KF0Y';

        return [
            'valid-single-aud' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                true,
            ],
            'valid-multiple-auds' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                true,
            ],
            'invalid-no-sub' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-without-nonce' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-bad-nonce' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-567',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-no-iat' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'valid-at_hash' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                    'at_hash' => '77QmUPtjPfzWtF2AnpK9RQ',
                ],
                $idToken,
                $accessToken,
                true,
            ],
            'invalid-at_hash' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                    'at_hash' => 'invalid-at-hash',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-bad-iat' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time() + 400,
                    'exp' => time() + 300,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-no-exp' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                false,
            ],
            'invalid-bad-exp' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() - 400,
                    'nonce' => 'nonce-123',
                ],
                $idToken,
                $accessToken,
                false,
            ],

        ];
    }

    #[DataProvider('provide_test_verify_logout_token_claims_data')]
    public function test_verify_logout_token_claims($claims, $expectedResult)
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org',
            'fake-client-id',
            'fake-client-secret',
            'https://localhost/callback');

        $actualResult = true;
        try {
            $client->verifyLogoutTokenClaims($claims);
        } catch (\Throwable $exception) {
            $actualResult = false;
        }

        $this->assertEquals($expectedResult, $actualResult);
    }

    public static function provide_test_verify_logout_token_claims_data(): array
    {
        return [
            'valid-single-aud' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                true,
            ],
            'valid-multiple-auds' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                true,
            ],
            'invalid-no-sid-and-no-sub' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'valid-no-sid' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                true,
            ],
            'valid-no-sub' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                true,
            ],
            'invalid-with-nonce' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                    'nonce' => 'must-not-be-set',
                ],
                false,
            ],
            'invalid-no-events' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'nonce' => 'must-not-be-set',
                ],
                false,
            ],
            'invalid-no-backchannel-event' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [],
                    'nonce' => 'must-not-be-set',
                ],
                false,
            ],
            'invalid-no-backchannel-event-not-json' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => 'http://schemas.openid.net/event/backchannel-logout',
                    'nonce' => 'must-not-be-set',
                ],
                false,
            ],
            'invalid-no-backchannel-event-member-not-empty-json' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => 'test',
                    ],
                    'nonce' => 'must-not-be-set',
                ],
                false,
            ],
            'invalid-no-iat' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'invalid-bad-iat' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time() + 400,
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'invalid-no-exp' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'invalid-bad-exp' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => ['fake-client-id', 'some-other-aud'],
                    'sid' => 'fake-client-sid',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() - 301,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'valid-missing-jti' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'valid-single-aud' => [
                (object) [
                    'iss' => 'https://example.org',
                    'aud' => 'fake-client-id',
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                true,
            ],
            'invalid-no-iss' => [
                (object) [
                    'aud' => 'fake-client-id',
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
            'invalid-bad-iss' => [
                (object) [
                    'iss' => 'https://bad-issuer.org',
                    'aud' => 'fake-client-id',
                    'sid' => 'fake-client-sid',
                    'sub' => 'fake-client-sub',
                    'jti' => 'fake-client-jti',
                    'iat' => time(),
                    'exp' => time() + 300,
                    'events' => (object) [
                        'http://schemas.openid.net/event/backchannel-logout' => (object) [],
                    ],
                ],
                false,
            ],
        ];
    }

    public function test_get_well_known_config_value_with_max_age()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery, 200, [
                'cache-control' => 'public, max-age=3600',
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(0);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(1);

        // Call again to check if the discovery document is not fetched again
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(0);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(1);

        // Travel forward in time to invalidate the cache
        $this->travel(3601)->seconds();

        // Call again to check if the discovery document is fetched again
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(0);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(2);
    }

    public function test_get_well_known_config_value_with_no_cache()
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery, 200, [
                'cache-control' => 'no-cache',
            ]),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(0);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(1);

        // Call again to check if the discovery document is fetched again
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(0);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(2);

        // Call again but setting a custom cache max age
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(60);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(3);

        // Call again to check if the discovery document is not fetched again
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(60);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(3);

        // Travel forward in time to invalidate the cache
        $this->travel(61)->seconds();
        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $client->setCacheConfigMaxAge(60);
        $client->getWellKnownConfigValue('issuer');
        Http::assertSentCount(4);
    }

    public function test_get_jwk_set_with_max_age()
    {
        $privateKey = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $kid = bin2hex(random_bytes(6));

        $jwksResponse = [
            'keys' => [
                [
                    'kid' => $kid,
                    ...$privateKey->toPublic()->jsonSerialize(),
                ],
            ],
        ];

        $clientMockBuilder = $this->getMockBuilder(OpenIDConnectClient::class)
            ->setConstructorArgs(['https://example.org',
                'fake-client-id',
                'fake-client-secret',
                'https://localhost/callback'])
            ->onlyMethods(['getWellKnownConfigValue']);

        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/jwks' => Http::response($jwksResponse, 200, ['cache-control' => 'public, max-age=3600']),
        ]);

        // Check if the jwks are correctly fetched
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(0);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(1);

        // Call again to check if the jwks are not fetched again, but returned from cache
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(0);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(1);

        // Travel forward in time to invalidate the cache
        $this->travel(3601)->seconds();

        // Call again to check if the jwks are fetched again
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(0);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(2);
    }

    public function test_get_jwk_set_with_no_cache()
    {
        $privateKey = JWKFactory::createRSAKey(
            2048,
            [
                'alg' => 'RS256',
                'use' => 'sig',
            ]
        );
        $kid = bin2hex(random_bytes(6));

        $jwksResponse = [
            'keys' => [
                [
                    'kid' => $kid,
                    ...$privateKey->toPublic()->jsonSerialize(),
                ],
            ],
        ];

        $clientMockBuilder = $this->getMockBuilder(OpenIDConnectClient::class)
            ->setConstructorArgs(['https://example.org',
                'fake-client-id',
                'fake-client-secret',
                'https://localhost/callback'])
            ->onlyMethods(['getWellKnownConfigValue']);

        Http::preventStrayRequests();
        Http::fake([
            'https://example.org/jwks' => Http::response($jwksResponse, 200, ['cache-control' => 'no-cache']),
        ]);

        // Check if the jwks are correctly fetched
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(0);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(1);

        // Call again to check if jwks are correctly fetched again
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(0);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(2);

        // Call again but setting a custom cache max age
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(60);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(3);

        // Call again to check if the jwks are not fetched again but returned from cache
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(60);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(3);

        // Travel forward in time to invalidate the cache
        $this->travel(61)->seconds();
        $client = $clientMockBuilder->getMock();
        $client->expects($this->once())->method('getWellKnownConfigValue')->with('jwks_uri')->willReturn('https://example.org/jwks');
        $client->setCacheJwksMaxAge(60);
        $jwksSet = $client->getJwkSet();
        $this->assertEquals($privateKey->thumbprint('sha256'), $jwksSet->get($kid)->thumbprint('sha256'));
        Http::assertSentCount(4);
    }

    /**
     * Check if header verification passes if the used algorithm
     * is supported by the RP and supported by the OP
     */
    public function test_verify_jws_header_for_id_token_alg_in_list()
    {
        $discovery = $this->discovery;
        $discovery['id_token_signing_alg_values_supported'] = ['RS256'];
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectNotToPerformAssertions();
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::ID_TOKEN);
    }

    /**
     * Check if header verification fails if the used algorithm is not in the list
     * provided by the discovery document.
     */
    public function test_verify_jws_header_for_id_token_alg_not_in_list()
    {
        $discovery = $this->discovery;
        $discovery['id_token_signing_alg_values_supported'] = ['RS512'];
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectException(OpenIDConnectValidationException::class);
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::ID_TOKEN);
    }

    /**
     * Check if header verification fails if the discovery document cannot be fetched
     * as we cannot check the OP-provided list of supported algorithms.
     */
    public function test_verify_jws_header_for_id_token_network_error()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectException(OpenIDConnectNetworkException::class);
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::ID_TOKEN);
    }

    /**
     * Check if header verification passes if the used algorithm
     * supported by the RP and the optional discovery parameter provides a list
     * containing the algorithm.
     */
    public function test_verify_jws_header_for_userinfo_alg_in_list()
    {
        $discovery = $this->discovery;
        $discovery['userinfo_signing_alg_values_supported'] = ['RS256'];
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectNotToPerformAssertions();
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::USERINFO);
    }

    /**
     * Check if header verification fails if used algorithm is not in the list
     * provided by the discovery document.
     */
    public function test_verify_jws_header_for_userinfo_alg_not_in_list()
    {
        $discovery = $this->discovery;
        $discovery['userinfo_signing_alg_values_supported'] = ['RS512'];
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectException(OpenIDConnectValidationException::class);
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::USERINFO);
    }

    /**
     * Check if header verification passes with all algorithms supported by the RP
     * if the optional discovery parameter userinfo_signing_alg_values_supported is not set.
     */
    public function test_verify_jws_header_for_userinfo_no_list()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::response($this->discovery),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectNotToPerformAssertions();
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::USERINFO);
    }

    /**
     * Check if header verification fails if the discovery document cannot be fetched
     * as we cannot check if the OP provides a restricted list of algorithms.
     */
    public function test_verify_jws_header_for_userinfo_network_error()
    {
        Http::fake([
            'https://example.org/.well-known/openid-configuration' => Http::failedConnection(),
        ]);

        $client = new OpenIDConnectClient('https://example.org', 'fake-client-id', 'fake-client-secret', 'https://localhost/callback');
        $jws = $this->createJWS(['sub' => 'test'], JWKFactory::createRSAKey(2048), 'RS256', ['kid' => 'test-kid']);
        $this->expectException(OpenIDConnectNetworkException::class);
        $client->verifyJWSHeader($jws, OpenIDConnectAlgorithmSubset::USERINFO);
    }
}
