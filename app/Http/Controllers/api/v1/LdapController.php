<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LdapRecord\Models\ModelNotFoundException;
use LdapRecord\Models\OpenLDAP\User;

class LdapController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @param  $guid
     * @return JsonResponse
     */
    public function show($guid)
    {
        try {
            $user = User::findByGuidOrFail($guid);

            $user = collect($user)->forget('userpassword')->forget('objectclass');

            return response()->json($user, 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'LDAP Model Not Found!'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param $guid
     * @return void
     */
    public function update(Request $request, $guid)
    {
        // TODO update LDAP info
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $guid
     * @return void
     */
    public function destroy($guid)
    {
        // TODO delete LDAP user
    }
}
