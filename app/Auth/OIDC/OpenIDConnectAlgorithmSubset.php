<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\OIDC;

enum OpenIDConnectAlgorithmSubset: string
{
    case ID_TOKEN = 'id_token_signing_alg_values_supported';
    case USERINFO = 'userinfo_signing_alg_values_supported';
}
