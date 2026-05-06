<?php

declare(strict_types=1);

namespace App\Auth\LDAP;

use App\Prometheus\Counter;
use Illuminate\Contracts\Auth\StatefulGuard;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Requests\LoginRequest;
use Symfony\Component\HttpFoundation\Response as ResponseAlias;

class LDAPController extends AuthenticatedSessionController
{
    public function __construct(StatefulGuard $guard)
    {
        config(['fortify.guard' => 'ldap']);
        config(['fortify.username' => 'username']);

        parent::__construct($guard);
    }

    /**
     * Process the login request
     */
    public function login(LoginRequest $request)
    {
        $response = $this->loginPipeline($request)->then(function ($request) {
            return response()->json(['two_factor' => false]);
        });

        if ($response->exception != null && $response->getStatusCode() !== ResponseAlias::HTTP_TOO_MANY_REQUESTS) {
            Counter::get('login_failed_total')->inc('ldap');
        }

        return $response;
    }
}
