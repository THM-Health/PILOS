<?php

namespace App\Services;

use App\Models\Room;
use App\Models\RoomPersonalizedLink;

/**
 * Service class to make the results of the RoomAuthenticate middleware available in all parts of the application.
 * Singleton, access via dependency injection or app()->make(RoomAuthService::class)
 */
class RoomAuthService
{
    /**
     * @var array Nested array of the attributes of each room
     */
    protected $rooms = [];

    /**
     * Get the value of a specific attribute for a room.
     *
     * @param  Room  $room  The room object.
     * @param  string  $attribute  The name of the attribute to retrieve.
     * @return mixed|null The value of the attribute or null if not found.
     */
    protected function getRoomAttributes(Room $room, string $attribute): mixed
    {
        if (! isset($this->rooms[$room->id])) {
            return null;
        }

        if (! isset($this->rooms[$room->id][$attribute])) {
            return null;
        }

        return $this->rooms[$room->id][$attribute];
    }

    /**
     * Set the value of a specific attribute for a room.
     *
     * @param  Room  $room  The room object.
     * @param  string  $attribute  The name of the attribute to set.
     * @param  mixed  $value  The value to set for the attribute.
     * @return void
     */
    protected function setRoomAttributes(Room $room, string $attribute, mixed $value)
    {
        if (! isset($this->rooms[$room->id])) {
            $this->rooms[$room->id] = [];
        }

        $this->rooms[$room->id][$attribute] = $value;
    }

    /**
     * Set the authentication status of a user for a room.
     *
     * @param  Room  $room  The room object.
     * @param  bool  $authenticated  The authentication status (true or false).
     */
    public function setAuthenticated(Room $room, bool $authenticated): void
    {
        $this->setRoomAttributes($room, 'authenticated', $authenticated);
    }

    /**
     * Check if a user is authenticated for a room.
     *
     * @param  Room  $room  The room object.
     * @return bool Returns true if user is authenticated for the room, otherwise false.
     */
    public function isAuthenticated(Room $room): bool
    {
        return $this->getRoomAttributes($room, 'authenticated') === true;
    }

    /**
     * Set the room personalized link for a room.
     *
     * @param  Room  $room  The room object.
     * @param  RoomPersonalizedLink|null  $personalizedLink  The RoomPersonalizedLink object or null to unset the personalized link.
     */
    public function setRoomPersonalizedLink(Room $room, ?RoomPersonalizedLink $personalizedLink): void
    {
        $this->setRoomAttributes($room, 'personalizedLink', $personalizedLink);
    }

    /**
     * Get the room personalized link of the current request for a room.
     *
     * @param  Room  $room  The room object.
     * @return RoomPersonalizedLink|null Returns the RoomPersonalizedLink object or null if the personalized link is not set.
     */
    public function getRoomPersonalizedLink(Room $room): ?RoomPersonalizedLink
    {
        return $this->getRoomAttributes($room, 'personalizedLink');
    }
}
