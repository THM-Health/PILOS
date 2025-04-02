<?php

namespace App\Policies;

use App\Enums\RecordingAccess;
use App\Models\RecordingFormat;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\User;
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
     * @return bool
     */
    public function viewAny(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can view all rooms.
     *
     * @return bool
     */
    public function viewAll(User $user)
    {
        return $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can view the room.
     *
     * @return bool
     */
    public function view(?User $user, Room $room)
    {
        return true;
    }

    /**
     * Determine whether the user can view the room settings.
     *
     * @return bool
     */
    public function viewSettings(User $user, Room $room)
    {
        return $user->can('update', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can view the room access code.
     *
     * @return bool
     */
    public function viewAccessCode(User $user, Room $room)
    {
        return $user->can('viewSettings', $room) || $room->isModerator($user);
    }

    /**
     * Determine whether the user can view the statistics of the room.
     *
     * @return bool
     */
    public function viewStatistics(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can create rooms.
     *
     * @return bool
     */
    public function create(User $user)
    {
        return $user->can('rooms.create');
    }

    /**
     * Determine whether the user can start a new meeting in a room.
     *
     * @return bool
     */
    public function start(?User $user, Room $room)
    {
        if ($room->getRoomSetting('everyone_can_start')) {
            return true;
        }

        if ($room->owner->is($user)) {
            return true;
        }

        if ($room->isModerator($user)) {
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
     * @return bool
     */
    public function update(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can transfer the room ownership
     *
     * @return bool
     */
    public function transfer(User $user, Room $room)
    {
        return $room->owner->is($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can delete the room.
     *
     * @return bool
     */
    public function delete(User $user, Room $room)
    {
        return $room->owner->is($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can view all members of the room
     *
     * @return bool
     */
    public function viewMembers(User $user, Room $room)
    {
        return $user->can('manageMembers', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user create, update, delete members
     *
     * @return bool
     */
    public function manageMembers(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can view all personalized tokens of the room
     *
     * @return bool
     */
    public function viewTokens(User $user, Room $room)
    {
        return $user->can('manageTokens', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user create, update, delete personalized tokens
     *
     * @return bool
     */
    public function manageTokens(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user create, update, delete files
     *
     * @return bool
     */
    public function manageFiles(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    /**
     * Determine whether the user can see all files
     *
     * @return bool
     */
    public function viewAllFiles(User $user, Room $room)
    {
        return $user->can('manageFiles', $room) || $user->can('rooms.viewAll');
    }

    /**
     * Determine whether the user can download files
     *
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

    public function viewAllRecordings(User $user, Room $room)
    {
        return $user->can('manageRecordings', $room) || $user->can('rooms.viewAll');
    }

    public function manageRecordings(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }

    public function viewRecordingFormat(?User $user, Room $room, RecordingFormat $recordingFormat)
    {
        if ($user && $user->can('viewAllRecordings', $room)) {
            return true;
        }

        if ($recordingFormat->disabled) {
            return false;
        }

        if ($recordingFormat->recording->access == RecordingAccess::EVERYONE) {
            return true;
        }

        if ($recordingFormat->recording->access == RecordingAccess::PARTICIPANT) {
            return $room->isMember($user);
        }

        if ($recordingFormat->recording->access == RecordingAccess::MODERATOR) {
            return $room->isModerator($user);
        }

        return false;
    }

    public function viewStreaming(User $user, Room $room)
    {
        return $user->can('manageStreaming', $room) || $user->can('rooms.viewAll');
    }

    public function manageStreaming(User $user, Room $room)
    {
        return $room->owner->is($user) || $room->isCoOwner($user) || $user->can('rooms.manage');
    }
}
