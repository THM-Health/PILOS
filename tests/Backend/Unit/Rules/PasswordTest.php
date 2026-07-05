<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit\Rules;

use App\Rules\Password;
use Illuminate\Support\Facades\Validator;
use Tests\Backend\TestCase;

class PasswordTest extends TestCase
{
    public function test_passes()
    {
        $this->assertTrue(Validator::make(['password' => '1_aA'], ['password' => new Password])->passes());
        $this->assertTrue(Validator::make(['password' => 'A_a1'], ['password' => new Password])->passes());
        $this->assertTrue(Validator::make(['password' => 'Aa_1Aa1_'], ['password' => new Password])->passes());
        $this->assertFalse(Validator::make(['password' => 'Aa1'], ['password' => new Password])->passes());
        $this->assertFalse(Validator::make(['password' => 'äA'], ['password' => new Password])->passes());
        $this->assertFalse(Validator::make(['password' => '1_a'], ['password' => new Password])->passes());
    }

    public function test_message()
    {
        $message = Validator::make(['password' => 'Aa1'], ['password' => new Password])->errors()->first('password');
        $this->assertEquals(__('validation.custom.password'), $message);
    }
}
