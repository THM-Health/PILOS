<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

/**
 * Custom status response codes of the api
 */
enum TimePeriod: int
{
    case ONE_WEEK = 7;
    case TWO_WEEKS = 14;
    case ONE_MONTH = 30;
    case THREE_MONTHS = 90;
    case SIX_MONTHS = 180;
    case ONE_YEAR = 365;
    case TWO_YEARS = 730;
    case UNLIMITED = -1;
}
