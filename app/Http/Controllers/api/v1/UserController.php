<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;

class UserController extends Controller
{

    /**
     * Search for users in the whole database, based on first name and last name
     * @param  Request                                                     $request query parameter with search query
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        return \App\Http\Resources\User::collection(User::withName( $request->get('query'))->limit(config('bigbluebutton.user_search_limit'))->get());
    }
}
