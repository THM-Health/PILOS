<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUser;
use App\Http\Resources\User as UserResource;
use App\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Lang;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    /**
     * Display a listing of the resource.
     * @param  Request                     $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('sortBy') && $request->has('orderBy')) {
            $query = $query->orderBy($request->query('sortBy'), $request->query('orderBy'));
        }

        if ($request->has('name')) {
            $query = $query->withName($request->query('name'));
        }

        $query = $query->paginate(env('MIX_PAGINATION_PAGE_SIZE', 15));

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

        return ($store === true) ? (response()->json($user, 201)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }

    /**
     * Display the specified resource.
     * @param  User         $user
     * @return JsonResponse
     */
    public function show(User $user)
    {
        return response()->json($user, 200);
    }

    /**
     * Update the specified resource in storage.
     * @param  StoreUser    $request
     * @param  User         $user
     * @return JsonResponse
     */
    public function update(StoreUser $request, User $user)
    {
        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;

        $update = $user->save();

        return ($update === true) ? (response()->json($user, 202)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }

    /**
     * Remove the specified resource from storage.
     * @param  User         $user
     * @return JsonResponse
     * @throws Exception
     */
    public function destroy(User $user)
    {
        $delete = $user->delete();

        return ($delete === true) ? (response()->json([], 204)) : (response()->json(['message' => Lang::get('validation.custom.request.400')], 400));
    }

    /**
     * Search for users in the whole database, based on first name and last name
     * @param  Request                     $request query parameter with search query
     * @return AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        return UserResource::collection(User::withName($request->get('query'))->limit(config('bigbluebutton.user_search_limit'))->get());
    }
}
