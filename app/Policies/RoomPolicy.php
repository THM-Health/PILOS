<?php

namespace App\Policies;

use App\Room;
use App\RoomFile;
use App\RoomToken;
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
     * Determine whether the user can view the room.
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewSettings(User $user, Room $room)
    {
        return $user->can('update', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can view the room access code.
     *
     * @param  User $user
     * @param  Room $room
     * @param ?RoomToken $token
     * @return bool
     */
    public function viewAccessCode(User $user, Room $room, ?RoomToken $token)
    {
        return $user->can('viewSettings', $room) || $room->isModerator($user, $token);
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
     * @param ?User $user
     * @param Room $room
     * @param ?RoomToken $token
     * @return bool
     */
    public function start(?User $user, Room $room, ?RoomToken $token)
    {
        if ($room->everyoneCanStart) {
            return true;
        }

        if ($room->owner->is($user)) {
            return true;
        }

        if ($room->isModerator($user, $token)) {
            return true;
        }

        if ($room->isCoOwner($user)) {
            return true;
        }

        if ($user && $user->can('rooms.manage')) {
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
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
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
        return $room->owner->is($user) || $user->can('rooms.manage');
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
        return $user->can('manageMembers', $room) || $user->can('rooms.viewAll');
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
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can view all personalized tokens of the room
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewTokens(User $user, Room $room)
    {
        return $user->can('manageTokens', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user create, update, delete personalized tokens
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function manageTokens(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user create, update, delete files
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function manageFiles(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can see all files
     *
     * @param  User $user
     * @param  Room $room
     * @return bool
     */
    public function viewAllFiles(User $user, Room $room)
    {
        return $user->can('manageFiles', $room) || $user->can('rooms.viewAll');
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
        if ($roomFile->download === true) {
            return true;
        }

        if ($user == null) {
            return false;
        }

        return $user->can('viewAllFiles', $room);
    }
}
