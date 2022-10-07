<?php

namespace App\Policies;

use App\Models\ServerPool;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServerPoolPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any server pools.
     *
     * @param  User $user
     * @return bool
     */
    public function viewAny(User $user)
    {
        return $user->can('serverPools.viewAny');
    }

    /**
     * Determine whether the user can view the server pool.
     *
     * @param  User       $user
     * @param  ServerPool $serverPool
     * @return bool
     */
    public function view(User $user, ServerPool $serverPool)
    {
        return $user->can('serverPools.view');
    }

    /**
     * Determine whether the user can create server pools.
     *
     * @param  User $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->can('serverPools.create');
    }

    /**
     * Determine whether the user can update the server pool.
     *
     * @param  User       $user
     * @param  ServerPool $serverPool
     * @return bool
     */
    public function update(User $user, ServerPool $serverPool)
    {
        return $user->can('serverPools.update');
    }

    /**
     * Determine whether the user can delete the server pool.
     *
     * @param  User       $user
     * @param  ServerPool $serverPool
     * @return bool
     */
    public function delete(User $user, ServerPool $serverPool)
    {
        return $user->can('serverPools.delete');
    }
}
