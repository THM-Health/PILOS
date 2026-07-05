<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\OIDC;

use Jose\Component\Checker\ClaimChecker;
use Jose\Component\Checker\InvalidClaimException;

final class EventsChecker implements ClaimChecker
{
    public function __construct(protected string $expectedEvent) {}

    public function checkClaim($value): void
    {
        if (! is_object($value)) {
            throw new InvalidClaimException('The claim "events" must be a JSON object.', 'events', $value);
        }

        if (! property_exists($value, $this->expectedEvent)) {
            throw new InvalidClaimException('The claim "events" does not contain the expected event "'.$this->expectedEvent.'".', 'events', $value);
        }

        if (! is_object($value->{$this->expectedEvent}) || ! empty((array) $value->{$this->expectedEvent})) {
            throw new InvalidClaimException('The claim "events" member "'.$this->expectedEvent.'" is not an empty JSON object.', 'events', $value);
        }
    }

    public function supportedClaim(): string
    {
        return 'events';
    }
}
