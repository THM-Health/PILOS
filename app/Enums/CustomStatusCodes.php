<?php

namespace App\Enums;

/**
 * Custom status response codes of the api
 */
enum CustomStatusCodes: int
{
    case ROOM_NOT_RUNNING = 460;
    case NO_SERVER_AVAILABLE = 461;
    case ROOM_START_FAILED = 462;
    case ROOM_LIMIT_EXCEEDED = 463;
    case ROLE_DELETE_LINKED_USERS = 464;
    case ROLE_UPDATE_PERMISSION_LOST = 465;
    case STALE_MODEL = 428;
    case PASSWORD_RESET_FAILED = 466;
    case ROOM_TYPE_INVALID = 467;
    case FEATURE_DISABLED = 468;
    case MEETING_ATTENDANCE_NOT_ENDED = 469;
    case MEETING_ATTENDANCE_DISABLED = 470;
    case EMAIL_CHANGE_THROTTLE = 471;
    case JOIN_FAILED = 472;
    case ROOM_ALREADY_RUNNING = 474;
}
