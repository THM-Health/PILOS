<?php

namespace App\Policies;

use App\Enums\RoomUserRole;
use App\Room;
use App\RoomFile;
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
     * @param  User $user
     * @return bool
     */
    public function viewAny(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can view all rooms.
     *
     * @param  User $user
     * @return bool
     */
    public function viewAll(User $user)
    {
        return $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can view the room.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function view(?User $user, Room $room)
    {
        return $user != null || $room->allowGuests;
    }

    /**
     * Determine whether the user can view the room settings.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewSettings(User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user can view the statistics of the room.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewStatistics(User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user can create rooms.
     *
     * @param  User $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->can('rooms.create');
    }

    /**
     * Determine whether the user can start a new meeting in a room.
     *
     * @param  User $user
     * @return bool
     */
    public function start(?User $user, Room $room)
    {
        if ($room->everyoneCanStart) {
            return true;
        }

        if ($room->isModeratorOrOwner($user)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can update the room.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function update(User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user can delete the room.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function delete(User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user can view all members of the room
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewMembers(User $user, Room $room)
    {
        return $room->owner->is($user); // or $room->members()->wherePivot('role', RoomUserRole::MODERATOR)->get()->contains($user);
    }

    /**
     * Determine whether the user create, update, delete members
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function manageMembers(User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user create, update, delete files
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function manageFiles(?User $user, Room $room)
    {
        return $room->owner->is($user);
    }

    /**
     * Determine whether the user can download files
     *
     * @param  User     $user
     * @param  Room     $room
     * @param  RoomFile $roomFile
     * @return bool
     */
    public function downloadFile(?User $user, Room $room, RoomFile $roomFile)
    {
        return $room->owner->is($user) || $roomFile->download === true;
    }
}
