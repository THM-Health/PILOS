<?php

namespace App\Http\Controllers\api\v1\auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyEmailRequest;
use App\Services\EmailVerification\EmailVerificationService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class VerificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Email Verification Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling email verification for any
    | user that recently changed its email with the application.
    |
    | TODO: Add email verification for new users / on self registration
    | TODO: Emails may also be re-sent if the user didn't receive the original email message.
    |
    */

    /**
     * Process the email verification request.
     * @param  VerifyEmailRequest $request
     * @return Response
     */
    public function verify(VerifyEmailRequest $request)
    {
        $emailVerificationService = new EmailVerificationService(Auth::user());
        $success                  = $emailVerificationService->processVerification($request->input('token'), $request->input('email'));
        if ($success) {
            return response('', 200);
        } else {
            return response('', 422);
        }
    }
}
