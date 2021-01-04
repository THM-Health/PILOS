<?php

namespace Tests\Unit;

use App\Enums\CustomStatusCodes;
use App\Role;
use Carbon\Carbon;
use DateInterval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\CreatesApplication;
use Tests\TestCase;

class EnsureModelNotStaleTest extends TestCase
{
    use CreatesApplication, RefreshDatabase;

    protected function setUp(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES=true');

        parent::setUp();

        \Route::post('api/test/{role}', [
            'middleware' => ['api', 'check.stale:role,\App\Http\Resources\Role,withPermissions'],
            'as'         => 'test.stale.check',
            function (Role $role) {
                return 'OK';
            }
        ]);
    }

    protected function tearDown(): void
    {
        putenv('DISABLE_CATCHALL_ROUTES');
        parent::tearDown();
    }

    public function testInvalidUpdatedAt()
    {
        $role = factory(Role::class)->create();

        $this->postJson(route('test.stale.check', ['role' => $role]), ['updated_at' => 'test'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('updated_at');
    }

    public function testStaleModel()
    {
        $role = factory(Role::class)->create();

        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => $role->updated_at->sub(new DateInterval('P1D'))])
            ->assertStatus(CustomStatusCodes::STALE_MODEL)
            ->assertJsonFragment(['new_model' => json_decode((new \App\HTTP\Resources\Role(Role::find($role->id)))->withPermissions()->toJson(), true)]);

        $this->postJson(route('test.stale.check', ['role' => $role]), ['name' => 'foo', 'updated_at' => null])
            ->assertStatus(CustomStatusCodes::STALE_MODEL)
            ->assertJsonFragment(['new_model' => json_decode((new \App\HTTP\Resources\Role(Role::find($role->id)))->withPermissions()->toJson(), true)]);
    }

    public function testActualModel()
    {
        $role = factory(Role::class)->create(['updated_at' => null]);

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
