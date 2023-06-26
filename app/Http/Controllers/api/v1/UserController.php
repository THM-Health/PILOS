<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeEmailRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\NewUserRequest;
use App\Http\Requests\UserRequest;
use App\Http\Resources\User as UserResource;
use App\Http\Resources\UserSearch;
use App\Models\User;
use App\Notifications\UserWelcome;
use App\Services\AuthenticationService;
use App\Services\EmailVerification\EmailVerificationService;
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
use Illuminate\Support\Facades\Validator;
use Log;
use Storage;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
        $this->middleware('check.stale:user,\App\Http\Resources\User', ['only' => 'update']);
    }

    /**
     * Search for users in the whole database, based on first name and last name
     * @param  Request                     $request query parameter with search query
     * @return AnonymousResourceCollection
     */
    public function search(Request $request)
    {
        return UserSearch::collection(User::withName($request->get('query'))->orderBy('lastname', 'ASC')->orderBy('firstname', 'ASC')->limit(config('bigbluebutton.user_search_limit'))->get());
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

        if ($request->has('role')) {
            Validator::make($request->all(), [
                'role' => 'required|exists:roles,id',
            ])->validate();
            $resource = $resource->withRole($request->query('role'));
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
    public function store(NewUserRequest $request)
    {
        $user = new User();

        $user->firstname            = $request->firstname;
        $user->lastname             = $request->lastname;
        $user->email                = $request->email;
        $user->locale               = $request->user_locale;
        $user->timezone             = $request->timezone;

        if (!$request->generate_password) {
            $user->password = Hash::make($request->new_password);
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

        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     *
     * @param  User         $user
     * @return UserResource
     */
    public function show(User $user)
    {
        return new UserResource($user);
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
            if ($request->has('firstname')) {
                $user->firstname = $request->firstname;
            }
            if ($request->has('lastname')) {
                $user->lastname = $request->lastname;
            }
        }

        // User requested to change image
        if ($request->has('image')) {
            // If user already has a profile image, delete current one to save disk space
            if ($user->image != null) {
                Storage::disk('public')->delete($user->image);
            }
            // User has provided a new profile image
            if (!empty($request->file('image'))) {
                // Save new image
                $path        = $request->file('image')->storePublicly('profile_images', 'public');
                $user->image = $path;
                Log::info('Updated profile image of user {user}', ['user' => $user->getLogLabel()]);
            }
            // Image should be removed
            else {
                $user->image = null;
                Log::info('Removed profile image of user {user}', ['user' => $user->getLogLabel()]);
            }
        }

        if ($request->has('user_locale')) {
            $user->locale = $request->user_locale;
        }
        if ($request->has('timezone')) {
            $user->timezone = $request->timezone;
        }
        if ($request->has('bbb_skip_check_audio')) {
            $user->bbb_skip_check_audio = $request->bbb_skip_check_audio;
        }

        $user->save();

        Log::info('Updated attributes for user {user}', ['user' => $user->getLogLabel()]);

        if (Auth::user()->can('editUserRole', $user) && $request->has('roles')) {
            $user->roles()->syncWithoutDetaching($request->roles);
            $user->roles()->detach($user->roles()->wherePivot('automatic', '=', false)
                ->whereNotIn('role_id', $request->roles)->pluck('role_id')->toArray());

            Log::info('Updated roles for user {user}', ['user' => $user->getLogLabel(), 'roles' => $request->roles]);
        }

        $user->touch();
        $user->refresh();

        return new UserResource($user);
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
        $authService = new AuthenticationService($user);
        $response    = $authService->sendResetLink();

        return response()->json([
            'message' => trans($response)
        ], $response === Password::RESET_LINK_SENT ? 200 : CustomStatusCodes::PASSWORD_RESET_FAILED);
    }

    public function changeEmail(ChangeEmailRequest $request, User $user)
    {
        // Email changed
        if ($user->email != $request->email) {
            // User is changing his own email, require verification
            if (Auth::user()->is($user)) {
                Log::info('Requesting to change email to {email}', ['email' => $request->email]);
                $emailVerificationService = new EmailVerificationService($user);
                $success                  = $emailVerificationService->sendEmailVerificationNotification($request->email);
                if ($success) {
                    Log::info('Verification for email change was send to {email}', ['email' => $request->email]);

                    return response()->noContent(202);
                } else {
                    Log::warning('Reached throttle limit for email change', ['email' => $request->email]);
                    abort(CustomStatusCodes::EMAIL_CHANGE_THROTTLE);
                }
            }
            // Admin is changing the email of another user, no verification required
            else {
                $emailVerificationService = new EmailVerificationService($user);
                $emailVerificationService->changeEmail($request->email);
                $user->refresh();

                Log::notice('Email of user {user} was chanaged to {email}', ['user' => $user->getLogLabel(), 'email' => $request->email]);

                return new UserResource($user);
            }
        } else {
            return new UserResource($user);
        }
    }

    public function changePassword(ChangePasswordRequest $request, User $user)
    {
        $authService = new AuthenticationService($user);

        // If user is changing his own password, keep current user session alive, invalidate all other sessions
        $keepSession = Auth::user()->is($user) ? session()->getId() : null;

        $authService->changePassword($request->new_password, $keepSession);

        Log::notice('Password of user {user} was changed', ['user' => $user->getLogLabel()]);

        return new UserResource($user);
    }
}
