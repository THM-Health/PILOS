<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\User as UserResource;
use App\User;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
        $this->middleware('check.stale:user,\App\Http\Resources\User,roles', ['only' => 'update']);
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

    /**
     * Display a listing of the resource.
     *
     * @param  Request                     $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $resource = User::all();

        if ($request->has('sort_by') && $request->has('sort_direction')) {
            $by  = $request->query('sort_by');
            $dir = $request->query('sort_direction');

            if (in_array($by, ['id', 'firstname', 'lastname', 'email', 'authenticator']) && in_array($dir, ['asc', 'desc'])) {
                $resource = $resource->orderBy($by, $dir);
            }
        }

        if ($request->has('name')) {
            $resource = $resource->withName($request->query('name'));
        }

        $resource = $resource->paginate(setting('pagination_page_size'));

        return UserResource::collection($resource);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  UserRequest  $request
     * @return UserResource
     */
    public function store(UserRequest $request)
    {
        $user = new User();

        $user->firstname = $request->firstname;
        $user->lastname  = $request->lastname;
        $user->email     = $request->email;
        $user->locale    = $request->user_locale;
        $user->username  = $request->username;
        $user->password  = Hash::make($request->password);

        // TODO: email verification
        $user->email_verified_at = $user->freshTimestamp();

        $user->save();
        $user->roles()->sync($request->roles);

        // Load user data from database to load also the defaults from the database
        $user->refresh();

        return (new UserResource($user))->withRoles();
    }

    /**
     * Display the specified resource.
     *
     * @param  User         $user
     * @return UserResource
     */
    public function show(User $user)
    {
        return (new UserResource($user))->withRoles();
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  UserRequest            $request
     * @param  User                   $user
     * @return UserResource
     * @throws AuthorizationException
     */
    public function update(UserRequest $request, User $user)
    {
        if ($user->authenticator === 'users') {
            $user->firstname = $request->firstname;
            $user->lastname  = $request->lastname;
            $user->email     = $request->email;
            $user->username  = $request->username;

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            // TODO: email verification
            if ($user->wasChanged('email')) {
                $user->email_verified_at = $user->freshTimestamp();
            }
        }

        $user->locale = $request->user_locale;
        $user->touch();
        $user->save();

        if (Auth::user()->can('editUserRole', $user)) {
            $user->roles()->syncWithoutDetaching($request->roles);
            $user->roles()->detach($user->roles()->wherePivot('automatic', '=', false)
                ->whereNotIn('role_id', $request->roles)->pluck('role_id')->toArray());
        }

        $user->refresh();

        return (new UserResource($user))->withRoles();
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  User                  $user
     * @return JsonResponse|Response
     * @throws Exception
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }
}
