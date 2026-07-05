<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

/**
 * Custom error messages of the api
 */
enum CustomErrorMessages: string
{
    case ROOM_INVALID_AUTH_TOKEN = 'invalid_auth_token';
    case ROOM_INVALID_CODE = 'invalid_code';
    case ROOM_REQUIRE_CODE = 'require_code';
    case ROOM_INVALID_PERSONALIZED_LINK = 'invalid_personalized_link';
    case GUESTS_NOT_ALLOWED = 'guests_not_allowed';
    case GUESTS_ONLY = 'guests_only';
    case FORBIDDEN = 'forbidden';
    case FILE_NOT_FOUND = 'file_not_found';
    case NOT_FOUND = 'not_found';
}
