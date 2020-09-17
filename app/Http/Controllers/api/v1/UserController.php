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

        $query = $query->paginate(config('settings.defaults.pagination_page_size'));

        return UserResource::collection($query);
    }

    /**
     * Store a newly created resource in storage.
     * @param  StoreUser    $request
     * @return UserResource
     */
    public function store(StoreUser $request)
    {
        $user = new User();

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;
        $user->password  = Hash::make($request->password);

        if (!$user->save()) {
            abort(400, __('validation.custom.request.400'));
        }

        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     * @param  User         $user
     * @return UserResource
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     * @param  StoreUser    $request
     * @param  User         $user
     * @return UserResource
     */
    public function update(StoreUser $request, User $user)
    {
        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->username  = $request->username;

        if (!$user->save()) {
            abort(400);
        }

        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     * @param  User         $user
     * @return JsonResponse
     * @throws Exception
     */
    public function destroy(User $user)
    {
        if (!$user->delete()) {
            abort(400);
        }

        return response()->json([], 204);
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
