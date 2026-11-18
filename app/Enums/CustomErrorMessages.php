<?php

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
    case ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET = 'system_default_presentation_not_set';
    case GUESTS_NOT_ALLOWED = 'guests_not_allowed';
    case GUESTS_ONLY = 'guests_only';
    case FORBIDDEN = 'forbidden';
    case FILE_NOT_FOUND = 'file_not_found';
    case NOT_FOUND = 'not_found';
}
