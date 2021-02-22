<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\User as UserResource;
use App\Notifications\UserWelcome;
use App\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
        $this->middleware('check.stale:user,\App\Http\Resources\User,withRoles,withTimezones', ['only' => 'update']);
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
        $resource = User::query();

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

        $user->firstname            = $request->firstname;
        $user->lastname             = $request->lastname;
        $user->email                = $request->email;
        $user->locale               = $request->user_locale;
        $user->bbb_skip_check_audio = $request->bbb_skip_check_audio;
        $user->timezone             = $request->timezone;

        if (!$request->generate_password) {
            $user->password = Hash::make($request->password);
        } else {
            $user->password             = Hash::make(bin2hex(random_bytes(32)));
            $user->initial_password_set = true;
        }

        // TODO: email verification
        $user->email_verified_at = $user->freshTimestamp();

        $user->save();
        $user->roles()->sync($request->roles);

        // Load user data from database to load also the defaults from the database
        $user->refresh();

        if ($request->generate_password) {
            $broker = Password::broker('new_users');
            $token  = $broker->createToken($user);
            $reset  = DB::table('password_resets')
                ->where('email', '=', $user->email)
                ->first();
            $user->notify(new UserWelcome($token, Carbon::parse($reset->created_at)));
        }

        return (new UserResource($user))->withRoles()->withTimezones();
    }

    /**
     * Display the specified resource.
     *
     * @param  User         $user
     * @return UserResource
     */
    public function show(User $user)
    {
        return (new UserResource($user))->withRoles()->withTimezones();
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
        if (Auth::user()->can('updateAttributes', $user)) {
            $user->firstname = $request->firstname;
            $user->lastname  = $request->lastname;
            $user->email     = $request->email;

            // TODO: email verification
            if ($user->wasChanged('email')) {
                $user->email_verified_at = $user->freshTimestamp();
            }
        }

        if ($user->authenticator === 'users') {
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }
        }

        $user->locale               = $request->user_locale;
        $user->timezone             = $request->timezone;
        $user->bbb_skip_check_audio = $request->bbb_skip_check_audio;
        $user->touch();
        $user->save();

        if (Auth::user()->can('editUserRole', $user)) {
            $user->roles()->syncWithoutDetaching($request->roles);
            $user->roles()->detach($user->roles()->wherePivot('automatic', '=', false)
                ->whereNotIn('role_id', $request->roles)->pluck('role_id')->toArray());
        }

        $user->refresh();

        return (new UserResource($user))->withRoles()->withTimezones();
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

    /**
     * Send a password reset email to the specified users email.
     *
     * @param  User         $user
     * @return JsonResponse
     */
    public function resetPassword(User $user)
    {
        $response = Password::broker('users')->sendResetLink([
            'authenticator' => 'users',
            'email'         => $user->email
        ]);

        return response()->json([
            'message' => trans($response)
        ], $response === Password::RESET_LINK_SENT ? 200 : CustomStatusCodes::PASSWORD_RESET_FAILED);
    }
}
