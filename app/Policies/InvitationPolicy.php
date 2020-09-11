<?php

namespace App\Policies;

use App\Invitation;
use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvitationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any invitations.
     *
     * @param  User  $user
     * @return mixed
     */
    public function viewAny(User $user)
    {
        return $user->can('invitations.viewAny');
    }

    /**
     * Determine whether the user can view the invitation.
     *
     * @param  User       $user
     * @param  Invitation $invitation
     * @return mixed
     */
    public function view(User $user, Invitation $invitation)
    {
        return $user->can('invitations.viewAny');
    }

    /**
     * Determine whether the user can create invitations.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('invitations.create');
    }

    /**
     * Determine whether the user can update the invitation.
     *
     * @param  User       $user
     * @param  Invitation $invitation
     * @return mixed
     */
    public function update(User $user, Invitation $invitation)
    {
        return $user->can('invitations.update');
    }

    /**
     * Determine whether the user can delete the invitation.
     *
     * @param  User       $user
     * @param  Invitation $invitation
     * @return mixed
     */
    public function delete(User $user, Invitation $invitation)
    {
        return $user->can('invitation.delete');
    }
}
