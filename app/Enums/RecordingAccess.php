<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

final class RecordingAccess extends Enum
{
    // everyone with access to the room, might require authentication or access code
    public const EVERYONE     =   0;
    // room member with role participant
    public const PARTICIPANT =   1;
    // room member with role moderator
    public const MODERATOR   =   2;
    // room member with role co_owner or room owner
    public const OWNER       =   3;
}
