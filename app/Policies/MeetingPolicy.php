<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MeetingPolicy
{
    use HandlesAuthorization;

    public function __construct()
    {
        //
    }

    /**
     * Determine whether the user can view any rooms.
     *
     * @return bool
     */
    public function viewAny(User $user)
    {
        return $user->can('meetings.viewAny');
    }
}
