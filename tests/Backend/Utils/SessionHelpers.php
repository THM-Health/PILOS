<?php

declare(strict_types=1);

namespace Tests\Backend\Utils;

use App\Models\Session;
use Illuminate\Support\Str;

trait SessionHelpers
{
    public function startNewSession($user = null): Session
    {
        $newSession = new Session;
        $newSession->id = Str::random(40);
        $newSession->user_agent = 'Agent 1';
        $newSession->ip_address = $this->faker->ipv4;
        $newSession->payload = '';
        $newSession->last_activity = now();
        $newSession->user()->associate($user);
        $newSession->save();

        $this->app['session']->setId($newSession->id);
        $this->app['session']->start();

        return $newSession;
    }
}
