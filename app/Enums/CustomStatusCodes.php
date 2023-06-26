<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Custom status response codes of the api
 * @package App\Enums
 */
final class CustomStatusCodes extends Enum
{
    public const MEETING_NOT_RUNNING          =   460;
    public const NO_SERVER_AVAILABLE          =   461;
    public const ROOM_START_FAILED            =   462;
    public const ROOM_JOIN_FAILED             =   463;
    public const ROOM_LIMIT_EXCEEDED          =   464;
    public const ROLE_DELETE_LINKED_USERS     =   465;
    public const ROLE_UPDATE_PERMISSION_LOST  =   466;
    public const STALE_MODEL                  =   428;
    public const PASSWORD_RESET_FAILED        =   467;
    public const ROOM_TYPE_INVALID            =   468;
    public const FEATURE_DISABLED             =   469;
    public const MEETING_ATTENDANCE_NOT_ENDED =   470;
    public const ATTENDANCE_AGREEMENT_MISSING =   471;
    public const EMAIL_CHANGE_THROTTLE        =   472;
}
