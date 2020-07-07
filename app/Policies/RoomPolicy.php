<?php

namespace App\Policies;

use App\Enums\RoomUserRole;
use App\Room;
use App\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RoomPolicy
{
    use HandlesAuthorization;

    public function __construct()
    {
        //
    }

    /**
     * Determine whether the user can view any rooms.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user)
    {
        //
    }

    /**
     * Determine whether the user can view the room.
     *
     * @param User $user
     * @param Room $room
     * @return bool
     */
    public function view(User $user, Room $room)
    {
        //
    }

    /**
     * Determine whether the user can create rooms.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user)
    {
        //
    }


    /**
     * Determine whether the user can create rooms.
     *
     * @param User $user
     * @return bool
     */
    public function start(?User $user, Room $room)
    {
        return $room->canStart($user);
    }



    /**
     * Determine whether the user can update the room.
     *
     * @param User $user
     * @param Room $room
     * @return bool
     */
    public function update(User $user, Room $room)
    {
        //
    }

    /**
     * Determine whether the user can delete the room.
     *
     * @param User $user
     * @param Room $room
     * @return bool
     */
    public function delete(User $user, Room $room)
    {
        //
    }

    /**
     * Determine whether the user can restore the room.
     *
     * @param User $user
     * @param Room $room
     * @return bool
     */
    public function restore(User $user, Room $room)
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the room.
     *
     * @param User $user
     * @param Room $room
     * @return bool
     */
    public function forceDelete(User $user, Room $room)
    {
        //
    }
}
