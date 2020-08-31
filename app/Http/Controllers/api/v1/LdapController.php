<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLdap;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Lang;
use LdapRecord\Models\ModelDoesNotExistException;
use LdapRecord\Models\ModelNotFoundException;
use LdapRecord\Models\OpenLDAP\User;

class LdapController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @param $uid
     * @return JsonResponse
     */
    public function show($uid)
    {
        try {
            $user = User::findByOrFail('uid', $uid);

            $user = collect($user)->forget('userpassword')->forget('objectclass');

            return response()->json($user, 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => Lang::get('validation.custom.ldap.exists')], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateLdap $request
     * @param $uid
     * @return JsonResponse
     */
    public function update(UpdateLdap $request, $uid)
    {
        try {
            $user = User::findByOrFail('uid', $uid);

            $user->mail      = $request->mail;
            $user->cn        = $request->cn;
            $user->givenname = $request->givenname;
            $user->sn        = $request->sn;

            $store = $user->save();

            return ($store === true) ? response()->json($user, 202) : response()->json(['message' => 'Bad Request!'], 404);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => Lang::get('validation.custom.ldap.exists')], 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $uid
     * @return JsonResponse
     */
    public function destroy($uid)
    {
        try {
            $user = User::findByOrFail('uid', $uid);

            $delete = $user->delete();

            return ($delete === true) ? response()->json([], 204) : response()->json(['message' => Lang::get('validation.custom.request.400')], 400);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => Lang::get('validation.custom.ldap.exists')], 404);
        } catch (ModelDoesNotExistException $e) {
            return response()->json(['message' => Lang::get('validation.custom.ldap.exists')], 404);
        }
    }
}
