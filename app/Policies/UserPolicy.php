<?php

namespace App\Policies;

use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any users.
     *
     * @param  User  $user
     * @return mixed
     */
    public function viewAny(User $user)
    {
        return $user->can('users.viewAny');
    }

    /**
     * Determine whether the user can view the user.
     *
     * @param  User  $user
     * @param  User  $userModel
     * @return mixed
     */
    public function view(User $user, User $userModel)
    {
        // user can view its own profile
        return $user->can('users.viewAny') || $userModel->id === $user->id;
    }

    /**
     * Determine whether the user can create users.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the user.
     *
     * @param  User  $user
     * @param  User  $userModel
     * @return mixed
     */
    public function update(User $user, User $userModel)
    {
        // user can update its own data
        return $user->can('users.update') || ($user->id === $userModel->id);
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @param  User  $user
     * @param  User  $userModel
     * @return mixed
     */
    public function delete(User $user, User $userModel)
    {
        // user cannot delete itself
        return $user->can('users.delete') && $user->id !== $userModel->id;
    }
}
