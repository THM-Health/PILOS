<?php

namespace App\Policies;

use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @param  User  $user
     * @return mixed
     */
    public function viewAny(User $user)
    {
        return $user->can('users.viewAny');
    }

    /**
     * Determine whether the user can view the model.
     *
     * @param  User  $user
     * @param  User  $model
     * @return mixed
     */
    public function view(User $user, User $model)
    {
        return $user->can('users.view') || $model->id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * @param  User  $user
     * @param  User  $model
     * @return mixed
     */
    public function update(User $user, User $model)
    {
        return $user->can('users.update') || $model->id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @param  User  $user
     * @param  User  $model
     * @return mixed
     */
    public function delete(User $user, User $model)
    {
        return $user->can('users.delete') && $model->id !== $user->id;
    }

    /**
     * Returns true if the user has permission to update users and the user model is not the
     * current users model.
     *
     * @param  User $user
     * @param  User $model
     * @return bool
     */
    public function editUserRole(User $user, User $model)
    {
        return $user->can('users.update') && $model->id !== $user->id;
    }

    /**
     * Returns true if the user has permission to update specific user attributes.
     *
     * @param  User $user
     * @param  User $model
     * @return bool
     */
    public function updateAttributes(User $user, User $model)
    {
        return $model->authenticator === 'users'
            && $user->can('update', $model)
            && ($user->can('users.updateOwnAttributes') || $model->id !== $user->id);
    }
}
