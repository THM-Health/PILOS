<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Custom status response codes of the api
 * @package App\Enums
 */
final class CustomStatusCodes extends Enum
{
    const MEETING_NOT_RUNNING         =   460;
    const NO_SERVER_AVAILABLE         =   461;
    const ROOM_START_FAILED           =   462;
    const ROOM_LIMIT_EXCEEDED         =   463;
    const ROLE_DELETE_LINKED_USERS    =   464;
    const ROLE_UPDATE_PERMISSION_LOST =   465;
}
