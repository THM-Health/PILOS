<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitation;
use App\Invitation;
use App\Mail\InvitationRegister;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Invitation::class, 'invitation');
    }

    /**
     * Check if the invitation token exists in the table
     * @param  Request      $request
     * @return JsonResponse
     */
    public function checkInvitationToken(Request $request)
    {
        $invitationTokenValid = false;

        if ($request->has('invitation_token')) {
            $invitationTokenValid = Invitation::query()
                ->where('invitation_token', $request->invitation_token)
                ->where('registered_at', null)
                ->exists();
        }

        return ($invitationTokenValid === true) ? response()->json(['message' => 'Invitation Token is valid!'], 200) : response()->json(['message' => 'Invitation Token is invalid'], 401);
    }

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        // TODO get invitation records
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  StoreInvitation $request
     * @return JsonResponse
     */
    public function store(StoreInvitation $request)
    {
        $emails = $request->email;

        foreach ($emails as $email) {
            $invitation = new Invitation();

            $invitation->invitation_token = Str::uuid();
            $invitation->email            = $email;

            $store = $invitation->save();

            if ($store === false) {
                return response()->json(['message' => Lang::get('validation.custom.request.400')], 400);
            }

            Mail::to($email)->send(new InvitationRegister($invitation));
        }

        return response()->json($emails, 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return void
     */
    public function show($id)
    {
        // TODO Show an invitation record
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  Request $request
     * @param  int     $id
     * @return void
     */
    public function update(Request $request, $id)
    {
        // TODO Update an invitation record
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return void
     */
    public function destroy($id)
    {
        // TODO Delete an invitation record
    }
}
