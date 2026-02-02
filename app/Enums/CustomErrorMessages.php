<?php

namespace App\Enums;

/**
 * Custom error messages of the api
 */
enum CustomErrorMessages: string
{
    case ROOM_INVALID_TOKEN = 'invalid_token';
    case ROOM_INVALID_CODE = 'invalid_code';
    case ROOM_REQUIRE_CODE = 'require_code';
    case ROOM_INVALID_PERSONALIZED_LINK = 'invalid_personalized_link';
    case ROOM_GUESTS_NOT_ALLOWED = 'guests_not_allowed';
    case ROOM_GUESTS_ONLY = 'guests_only';
    case ROOM_FILE_FORBIDDEN = 'forbidden';
    case ROOM_FILE_NOT_FOUND = 'file_not_found';
}
