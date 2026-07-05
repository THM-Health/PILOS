<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit\Rules;

use App\Models\Role;
use App\Models\RoomType;
use App\Models\User;
use App\Rules\ValidRoomType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Validator;
use Tests\Backend\TestCase;

class ValidRoomTypeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_passes()
    {
        $roleA = Role::factory()->create();
        $roleB = Role::factory()->create();
        $user = User::factory()->create();
        $user->roles()->sync([$roleB->id]);
        $roomTypeA = RoomType::factory()->create([
            'restrict' => true,
        ]);
        $roomTypeA->roles()->sync([$roleA->id]);
        $roomTypeB = RoomType::factory()->create([
            'restrict' => true,
        ]);
        $roomTypeB->roles()->sync([$roleB->id]);
        $roomTypeC = RoomType::factory()->create();
        $roomTypeC->roles()->sync([$roleA->id]);

        $this->assertFalse(Validator::make(['room_type' => null], ['room_type' => new ValidRoomType($user)])->passes());
        $this->assertFalse(Validator::make(['room_type' => 1337], ['room_type' => new ValidRoomType($user)])->passes());
        $this->assertFalse(Validator::make(['room_type' => $roomTypeA->id], ['room_type' => new ValidRoomType($user)])->passes());
        $this->assertTrue(Validator::make(['room_type' => $roomTypeB->id], ['room_type' => new ValidRoomType($user)])->passes());
        $this->assertTrue(Validator::make(['room_type' => $roomTypeC->id], ['room_type' => new ValidRoomType($user)])->passes());
    }

    public function test_message()
    {
        $user = User::factory()->create();
        $message = Validator::make(['room_type' => null], ['room_type' => new ValidRoomType($user)])->errors()->first('room_type');
        $this->assertEquals(__('validation.custom.invalid_room_type'), $message);
    }
}
