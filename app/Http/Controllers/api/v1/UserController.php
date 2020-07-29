<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\User as UserResource;
use App\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     * @param  Request                     $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        if ($request->firstname || $request->lastname || $request->username) {
            $this->search($request);
        }

        return UserResource::collection(User::paginate(env('MIX_PAGINATION_PER_PAGE', 15)));
    }

    /**
     * Search users based on query parameters
     * @param  Request                     $request
     * @return AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        $users = User::orWhere('firstname', 'like', '%' . $request->firstname . '%')
            ->orWhere('lastname', 'like', '%' . $request->lastname . '%')
            ->orWhere('username', 'like', '%' . $request->username . '%')
            ->paginate(env('MIX_PAGINATION_PER_PAGE', 15));

        return UserResource::collection($users);
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
     * @return JsonResponse
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if ($user) {
            $user->delete();
        } else {
            return response()->json(['message' => 'User not found!'], 404);
        }

        return response()->json(null, 204);
    }
}
