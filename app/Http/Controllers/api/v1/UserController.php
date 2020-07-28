<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;

class UserController extends Controller
{

    /**
     * Search for users in the whole database, based on first name and last name
     * @param Request $request query parameter with search query
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        // Remove multiple whitespaces
        $query = preg_replace('/\s\s+/', ' ', $request->get('query'));
        // Split each word in a separate query
        $query = explode(' ', $query);
        // define columns in which the query should exists
        $search_columns = ['firstname','lastname'];
        // find in users, where each query must exist in at least one of the defined columns
        $users = User::where(function ($a) use ($query,$search_columns) {
            foreach ($query as $value) {
                $a->where(function ($b) use ($value,$search_columns) {
                    foreach ($search_columns as $search_column) {
                        $b->orWhere($search_column, 'like', "%{$value}%");
                    }
                });
            }
        })->get();
        // return json with the results
        return \App\Http\Resources\User::collection($users);
    }
}
