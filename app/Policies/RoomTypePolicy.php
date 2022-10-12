<?php

namespace App\Policies;

use App\Models\RoomType;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RoomTypePolicy
{
    use HandlesAuthorization;

    public function __construct()
    {
        //
    }

    /**
     * Determine whether the user can view any room types.
     *
     * @param  User $user
     * @return bool
     */
    public function viewAny(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can view the room type.
     *
     * @param  User     $user
     * @param  RoomType $roomType
     * @return bool
     */
    public function view(User $user, RoomType $roomType)
    {
        return $user->can('roomTypes.view');
    }

    /**
     * Determine whether the user can create room types.
     *
     * @param  User $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->can('roomTypes.create');
    }

    /**
     * Determine whether the user can update the room type.
     *
     * @param  User     $user
     * @param  RoomType $roomType
     * @return bool
     */
    public function update(User $user, RoomType $roomType)
    {
        return $user->can('roomTypes.update');
    }

    /**
     * Determine whether the user can delete the room type.
     *
     * @param  User     $user
     * @param  RoomType $roomType
     * @return bool
     */
    public function delete(User $user, RoomType $roomType)
    {
        return $user->can('roomTypes.delete');
    }
}
