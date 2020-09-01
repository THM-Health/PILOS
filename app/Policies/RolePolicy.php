<?php

namespace App\Policies;

use App\Role;
use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RolePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     *
     * @param  \App\User $user
     * @return mixed
     */
    public function viewAny(User $user)
    {
        return $user->can('roles.viewAny');
    }

    /**
     * Determine whether the user can view the model.
     *
     * @param  \App\User $user
     * @param  \App\Role $role
     * @return mixed
     */
    public function view(User $user, Role $role)
    {
        return $user->can('roles.view');
    }

    /**
     * Determine whether the user can create models.
     *
     * @param  \App\User $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('roles.create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * @param  \App\User $user
     * @param  \App\Role $role
     * @return mixed
     */
    public function update(User $user, Role $role)
    {
        return $user->can('roles.update') && !$role->default;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @param  \App\User $user
     * @param  \App\Role $role
     * @return mixed
     */
    public function delete(User $user, Role $role)
    {
        return $user->can('roles.delete') && !$role->default;
    }
}
