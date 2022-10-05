<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Services\AuthenticationService;
use Auth;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index()
    {
        return SessionResource::collection(\Auth::user()->sessions()->orderByDesc('last_activity')->get());
    }

    public function destroy(Request $request)
    {
        $authService = new AuthenticationService(Auth::user());
        $authService->logoutOtherSessions($request->session()->getId());

        return response()->noContent();
    }
}
