<?php

namespace App\Policies;

use App\Server;
use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServerPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any servers.
     *
     * @param  User $user
     * @return bool
     */
    public function viewAny(User $user)
    {
        return $user->can('servers.viewAny');
    }

    /**
     * Determine whether the user can view the server.
     *
     * @param  User   $user
     * @param  Server $server
     * @return bool
     */
    public function view(User $user, Server $server)
    {
        return $user->can('servers.view');
    }

    /**
     * Determine whether the user can create servers.
     *
     * @param  User $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->can('servers.create');
    }

    /**
     * Determine whether the user can update the server.
     *
     * @param  User   $user
     * @param  Server $server
     * @return bool
     */
    public function update(User $user, Server $server)
    {
        return $user->can('servers.update');
    }

    /**
     * Determine whether the user can delete the server.
     *
     * @param  User   $user
     * @param  Server $server
     * @return bool
     */
    public function delete(User $user, Server $server)
    {
        return $user->can('servers.delete');
    }
}
