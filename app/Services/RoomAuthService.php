<?php

namespace App\Services;

use App\Models\Room;
use App\Models\RoomToken;

/**
 * Service class to make the results of the RoomAuthenticate middleware available in all parts of the application.
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
     * @param  Room       $room      The room object.
     * @param  string     $attribute The name of the attribute to retrieve.
     * @return mixed|null The value of the attribute or null if not found.
     */
    protected function getRoomAttributes(Room $room, string $attribute): mixed
    {
        if (!isset($this->rooms[$room->id])) {
            return null;
        }

        if (!isset($this->rooms[$room->id][$attribute])) {
            return null;
        }

        return $this->rooms[$room->id][$attribute];
    }

    /**
     * Set the value of a specific attribute for a room.
     *
     * @param  Room   $room      The room object.
     * @param  string $attribute The name of the attribute to set.
     * @param  mixed  $value     The value to set for the attribute.
     * @return void
     */
    protected function setRoomAttributes(Room $room, string $attribute, mixed $value)
    {
        if (!isset($this->rooms[$room->id])) {
            $this->rooms[$room->id] = [];
        }

        $this->rooms[$room->id][$attribute] = $value;
    }

    /**
     * Set the authentication status of a user for a room.
     *
     * @param  Room $room          The room object.
     * @param  bool $authenticated The authentication status (true or false).
     * @return void
     */
    public function setAuthenticated(Room $room, bool $authenticated): void
    {
        $this->setRoomAttributes($room, 'authenticated', $authenticated);
    }

    /**
     * Check if a user is authenticated for a room.
     *
     * @param  Room $room The room object.
     * @return bool Returns true if user is authenticated for the room, otherwise false.
     */
    public function isAuthenticated(Room $room): bool
    {
        return $this->getRoomAttributes($room, 'authenticated') === true;
    }

    /**
     * Set the room token for a room.
     *
     * @param  Room           $room      The room object.
     * @param  RoomToken|null $roomToken The RoomToken object or null to unset the token.
     * @return void
     */
    public function setRoomToken(Room $room, ?RoomToken $roomToken): void
    {
        $this->setRoomAttributes($room, 'token', $roomToken);
    }

    /**
     * Get the room token of the current request for a room.
     *
     * @param  Room           $room The room object.
     * @return RoomToken|null Returns the RoomToken object or null if the token is not set.
     */
    public function getRoomToken(Room $room): ?RoomToken
    {
        return $this->getRoomAttributes($room, 'token');
    }
}
