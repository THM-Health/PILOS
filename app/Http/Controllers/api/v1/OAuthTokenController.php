<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OAuthTokenResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class OAuthTokenController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $tokens = Auth::user()->oauthTokens()
            ->where('revoked', false)
            ->orderByDesc('created_at')
            ->get();

        return OAuthTokenResource::collection($tokens);
    }

    public function destroy(string $token)
    {
        $oauthToken = Auth::user()->oauthTokens()->findOrFail($token);

        $oauthToken->revoke();

        $oauthToken->refreshToken?->revoke();

        return response()->noContent();
    }
}
