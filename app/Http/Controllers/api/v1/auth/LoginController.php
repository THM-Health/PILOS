<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1\auth;

use App\Auth\OIDC\OIDCProvider;
use App\Auth\Shibboleth\ShibbolethProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Requests\LoginRequest;

class LoginController extends AuthenticatedSessionController
{
    public function login(LoginRequest $request)
    {
        return $this->loginPipeline($request)->then(function ($request) {
            return response()->json(['two_factor' => false]);
        });
    }

    public function logout(Request $request)
    {
        // Redirect url after logout
        $redirect = false;
        // Message to display on logout, e.g. incomplete logout
        $message = null;

        // Logout from external authentication provider
        switch (Auth::user()->authenticator) {
            case 'shibboleth':
                $redirect = app(ShibbolethProvider::class)->logout(url('/logout'));
                break;
            case 'oidc':
                $redirect = app(OIDCProvider::class)->logout(url('/logout'));
                if (! $redirect) {
                    $message = 'oidc_incomplete';
                }
                break;
        }

        // Destroy application session
        $this->logoutApplication($request);

        return response()->json([
            'redirect' => $redirect,
            'message' => $message,
        ]);
    }

    private function logoutApplication(Request $request)
    {
        $this->guard->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
