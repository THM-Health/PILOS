<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUser;
use App\Http\Requests\UpdateUser;
use App\Http\Resources\User as UserResource;
use App\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     * @param  Request                     $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $query = User::paginate(env('MIX_PAGINATION_PAGE_SIZE', 15));

        if ($request->has('name')) {
            $query = User::withName($request->name)->paginate(env('MIX_PAGINATION_PAGE_SIZE', 15));
        }

        return UserResource::collection($query);
    }

    /**
     * Store a newly created resource in storage.
     * @param  StoreUser    $request
     * @return JsonResponse
     */
    public function store(StoreUser $request)
    {
        $user = new User();

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;
        $user->password  = Hash::make($request->password);

        $store = $user->save();

        return ($store === true) ? (response()->json($user, 201)) : (response()->json(['message' => 'Bad Request!'], 400));
    }

    /**
     * Display the specified resource.
     * @param  User         $user
     * @return JsonResponse
     */
    public function show(User $user)
    {
        if (!$user) {
            response()->json(['message' => 'User not found!'], 404);
        }

        return response()->json($user, 200);
    }

    /**
     * Update the specified resource in storage.
     * @param  UpdateUser   $request
     * @param  User         $user
     * @return JsonResponse
     */
    public function update(UpdateUser $request, User $user)
    {
        if (!$user) {
            return response()->json(['message' => 'User not found!'], 404);
        }

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;

        $update = $user->save();

        return ($update === true) ? (response()->json($user, 202)) : (response()->json(['message' => 'Bad Request!'], 400));
    }

    /**
     * Remove the specified resource from storage.
     * @param  User         $user
     * @return JsonResponse
     * @throws Exception
     */
    public function destroy(User $user)
    {
        if (!$user) {
            return response()->json(['message' => 'User not found!'], 404);
        }

        $delete = $user->delete();

        return ($delete === true) ? (response()->json([], 204)) : (response()->json(['message' => 'Bad Request!'], 400));
    }
}
