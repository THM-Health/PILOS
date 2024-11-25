<?php

namespace Tests\Backend\Unit;

use App\Enums\CustomStatusCodes;
use App\Models\Role;
use Carbon\Carbon;
use DateInterval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class EnsureModelNotStaleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES=true');

        parent::setUp();

        \Route::post('api/test/{role}', [
            'middleware' => ['api', 'check.stale:role,\App\Http\Resources\Role,withPermissions'],
            'as' => 'test.stale.check',
            function (Role $role) {
                return 'OK';
            },
        ]);
    }

    protected function tearDown(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES');
        parent::tearDown();
    }

    public function test_invalid_updated_at()
    {
        $role = Role::factory()->create();

        $this->postJson(route('test.stale.check', ['role' => $role]), ['updated_at' => 'test'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('updated_at');
    }

    public function test_stale_model()
    {
        $role = Role::factory()->create();

        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => $role->updated_at->sub(new DateInterval('P1D'))])
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value)
            ->assertJsonFragment(['new_model' => json_decode((new \App\HTTP\Resources\Role(Role::find($role->id)))->withPermissions()->toJson(), true)]);

        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => null])
            ->assertStatus(CustomStatusCodes::STALE_MODEL->value)
            ->assertJsonFragment(['new_model' => json_decode((new \App\HTTP\Resources\Role(Role::find($role->id)))->withPermissions()->toJson(), true)]);
    }

    public function test_actual_model()
    {
        $role = Role::factory()->create(['updated_at' => null]);

        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => null])
            ->assertSuccessful()
            ->assertSeeText('OK');

        $now = Carbon::now();
        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => $now])
            ->assertSuccessful()
            ->assertSeeText('OK');

        $role->update(['updated_at' => $now]);
        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => $now])
            ->assertSuccessful()
            ->assertSeeText('OK');
    }
}
