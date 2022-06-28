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
    public const ROOM_LIMIT_EXCEEDED          =   463;
    public const ROLE_DELETE_LINKED_USERS     =   464;
    public const ROLE_UPDATE_PERMISSION_LOST  =   465;
    public const STALE_MODEL                  =   428;
    public const PASSWORD_RESET_FAILED        =   466;
    public const ROOM_TYPE_INVALID            =   467;
    public const FEATURE_DISABLED             =   468;
    public const MEETING_ATTENDANCE_NOT_ENDED =   469;
    public const ATTENDANCE_AGREEMENT_MISSING =   470;
}
