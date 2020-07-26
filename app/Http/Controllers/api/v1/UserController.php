<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     */
    public function index(Request $request)
    {
        if ($request->firstname && $request->lastname && $request->username) {
            DB::table('users')->orWhere('firstname', 'like', '%'.$request->firstname.'%')
                ->orWhere('lastname', 'like', '%'.$request->lastname.'%')
                ->orWhere('username', 'like', '%'.$request->username.'%')
                ->paginate(env('MIX_PAGINATION_PER_PAGE', 15));
        }

        return DB::table('users')->paginate(env('MIX_PAGINATION_PER_PAGE', 15));
    }

    /**
     * Store a newly created resource in storage.
     * @param Request $request
     */
    public function store(Request $request)
    {
        //TODO implement create an user method
    }

    /**
     * Display the specified resource.
     * @param $id
     */
    public function show($id)
    {
        //TODO implement fetch a specific user based on id method
    }

    /**
     * Update the specified resource in storage.
     * @param Request $request
     * @param $id
     */
    public function update(Request $request, $id)
    {
        //TODO implement update method on a specific user based on request method
    }

    /**
     * Remove the specified resource from storage.
     * @param $id
     */
    public function destroy($id)
    {
        //TODO implement delete user based on id method
    }
}
