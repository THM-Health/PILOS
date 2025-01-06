<?php

namespace Tests\Backend\Unit\Rules;

use App\Models\Role;
use App\Models\RoomType;
use App\Models\User;
use App\Rules\ValidRoomType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
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

        $validRoomType = new ValidRoomType($user);

        $this->assertFalse($validRoomType->passes('', null));
        $this->assertFalse($validRoomType->passes('', 1337));
        $this->assertFalse($validRoomType->passes('', $roomTypeA->id));
        $this->assertTrue($validRoomType->passes('', $roomTypeB->id));
        $this->assertTrue($validRoomType->passes('', $roomTypeC->id));
    }

    public function test_message()
    {
        $user = User::factory()->create();
        $this->assertEquals(__('validation.custom.invalid_room_type'), (new ValidRoomType($user))->message());
    }
}
