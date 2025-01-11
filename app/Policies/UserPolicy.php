<?php

namespace App\Policies;

use App\Models\User;
use App\Settings\UserSettings;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @return mixed
     */
    public function viewAny(User $user)
    {
        return $user->can('users.viewAny');
    }

    /**
     * Determine whether the user can view the model.
     *
     * @return mixed
     */
    public function view(User $user, User $model)
    {
        return $user->can('users.view') || $model->id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     *
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * @return mixed
     */
    public function update(User $user, User $model)
    {
        // Prevent users of the super-user role to be updated by users without the super-user role
        if ($model->superuser && ! $user->superuser) {
            return false;
        }

        return $user->can('users.update') || $model->id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @return mixed
     */
    public function delete(User $user, User $model)
    {
        // Prevent users of the super-user role to be deleted by users without the super-user role
        if ($model->superuser && ! $user->superuser) {
            return false;
        }

        return $user->can('users.delete') && $model->id !== $user->id;
    }

    /**
     * Returns true if the user has permission to update users and the user model is not the
     * current users model.
     *
     * @return bool
     */
    public function editUserRole(User $user, User $model)
    {
        return $user->can('users.update') && $model->id !== $user->id;
    }

    /**
     * Returns true if the user has permission to update specific user attributes.
     *
     * @return bool
     */
    public function updateAttributes(User $user, User $model)
    {
        return $model->authenticator === 'local'
            && $user->can('update', $model)
            && ($user->can('users.updateOwnAttributes') || $model->id !== $user->id);
    }

    /**
     * Returns true if the user has permission to change/reset user password.
     *
     * @return bool
     */
    public function changePassword(User $user, User $model)
    {
        return $model->authenticator === 'local'
            && $user->can('update', $model)
            && (app(UserSettings::class)->password_change_allowed || $model->id !== $user->id);
    }

    /**
     * Returns true if the user has the permission to reset the password.
     *
     * @return bool
     */
    public function resetPassword(User $user, User $model)
    {
        // Prevent users of the super-user role to be deleted by users without the super-user role
        if ($model->superuser && ! $user->superuser) {
            return false;
        }

        return $model->authenticator === 'local'
            && $user->can('update', $model)
            && $model->id !== $user->id
            && ! $model->initial_password_set;
    }
}
