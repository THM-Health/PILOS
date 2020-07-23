<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    public function search(Request $request)
    {
        // Remove multiple whitespaces
        $query = preg_replace('/\s\s+/', ' ', $request->get('query'));
        $query = explode(' ', $query);

        $search_columns = ['firstname','lastname'];

        $users = User::where(function ($a) use ($query,$search_columns) {
            foreach ($query as $value) {
                $a->where(function ($b) use ($value,$search_columns) {
                    foreach ($search_columns as $search_column) {
                        $b->orWhere($search_column, 'like', "%{$value}%");
                    }
                });
            }
        })->get();

        return \App\Http\Resources\User::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  Request                   $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  User                      $user
     * @return \Illuminate\Http\Response
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  Request                   $request
     * @param  User                      $user
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, User $user)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  User                      $user
     * @return \Illuminate\Http\Response
     */
    public function destroy(User $user)
    {
        //
    }
}
