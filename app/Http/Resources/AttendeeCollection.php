<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\MeetingAttendee */
class AttendeeCollection extends ResourceCollection
{
    /**
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        $guests = $this->collection->whereNotNull('session_id')->groupBy('session_id');
        $users  = $this->collection->whereNotNull('user_id')->groupBy('user_id');

        $guests = $guests->map(function ($guest, $key) {
            $sessions = $this->mapSessions($guest);

            return ['name' => $guest[0]->name, 'email' => null, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        $users = $users->map(function ($user, $key) {
            $sessions = $this->mapSessions($user);

            return ['name' => $user[0]->user->firstname.' '.$user[0]->user->lastname, 'email' => $user[0]->user->email, 'duration' => $sessions->sum('duration'), 'sessions' => $sessions];
        });

        return [
            'data' => Attendee::collection($guests->merge($users)->sortBy('name')->values()),
        ];
    }

    private function mapSessions($sessions)
    {
        return $sessions->map(function ($session, $key) {
            return ['join' => $session->join, 'leave' => $session->leave, 'duration' => $session->join->diffInMinutes($session->leave)];
        });
    }
}
