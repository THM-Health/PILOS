<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Utils;

use Jose\Component\Core\AlgorithmManager;
use Jose\Component\Core\JWK;
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
use Jose\Component\Signature\JWSBuilder;
use Jose\Component\Signature\Serializer\CompactSerializer;

trait JWTTestHelpers
{
    public function createJWS(array $claims, JWK $privateKey, string $alg, array $additionalHeaders = []): JWS
    {
        $algorithmManager = new AlgorithmManager([
            new RS256,
            new RS384,
            new RS512,

            new PS256,
            new PS384,
            new PS512,

            new ES256,
            new ES384,
            new ES512,

            new EdDSA,

            new HS256,
            new HS384,
            new HS512,
        ]);

        $jwsBuilder = new JWSBuilder($algorithmManager);

        $payload = json_encode($claims);

        return $jwsBuilder
            ->create()
            ->withPayload($payload)
            ->addSignature($privateKey, ['alg' => $alg, ...$additionalHeaders])
            ->build();
    }

    public function signClaims(array $claims, JWK $privateKey, string $alg, array $additionalHeaders = []): string
    {
        $jws = $this->createJWS($claims, $privateKey, $alg, $additionalHeaders);

        $serializer = new CompactSerializer;

        return $serializer->serialize($jws, 0);
    }

    public function base64url_encode($data)
    {
        // Convert Base64 to Base64URL by replacing "+" with "-" and "/" with "_" and remove tailing "=" if any
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
