<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Room filter
 * @package App\Enums
 */
final class RoomFilter extends Enum
{
    public const OWN     =   "own";
    public const OWN_AND_SHARED    =   "own_and_shared";
    public const ALL    =   "all";
}
