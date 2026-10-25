<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use Illuminate\Http\Request;
use Laravel\Passport\Contracts\AuthorizationViewResponse;
use Laravel\Passport\Http\Controllers\AuthorizationController;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Symfony\Component\HttpFoundation\Response;

class OAuthAuthorizationController extends AuthorizationController
{
    public function authorize(ServerRequestInterface $psrRequest, Request $request, ResponseInterface $psrResponse, AuthorizationViewResponse $viewResponse): Response|AuthorizationViewResponse
    {
        $this->guard = auth()->guard();

        return parent::authorize($psrRequest, $request, $psrResponse, $viewResponse);
    }
}
