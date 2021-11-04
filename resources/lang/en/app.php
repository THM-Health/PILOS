<?php

return [
    'errors' => [
        'stale_model'                   => 'The :model entity was updated in the meanwhile!',
        'room_start'                    => 'Starting failed! The room could not be started.',
        'not_running'                   => 'Joining failed! The room is currently closed.',
        'membership_disabled'           => 'Membership failed! Membership for this room is currently not available.',
        'not_member_of_room'            => 'The person is not a member of this room (anymore).',
        'file_not_found'                => 'The file could not be found.',
        'no_server_available'           => 'Currently there are no servers available.',
        'room_limit_exceeded'           => 'Creating room failed! You have reached the max. amount of rooms.',
        'role_delete_linked_users'      => 'The role is linked to users and therefore it can\'t be deleted!',
        'role_update_permission_lost'   => 'The changes of the role would lead to a lost of permissions to view and update roles for you!',
        'server_delete_failed'          => 'The server could not be deleted. To delete the server, it must be deactivated and no meetings must be running.',
        'server_pool_delete_failed'     => 'The server pool could not be deleted. To delete the server pool, it must not be used by any room type.',
        'room_type_invalid'             => 'The type of the room is restricted for special user groups. Please change the room type to start the room, if you are the owner if this room.',
        'no_room_access'                => 'You does not have the necessary permissions, to edit this room.',
        'meeting_attendance_disabled'   => 'The logging of attendance is unavailable.',
        'meeting_statistics_disabled'   => 'The usage data is unavailable.',
        'meeting_attendance_not_ended'  => 'The logging of attendance is not yet completed for this room.',
        'attendance_agreement_missing'  => 'Consent to record attendance is required.',
        'token_not_found'               => 'The personalized room link could not be found.',
    ],
    'model' => [
        'roles'        => 'role',
        'users'        => 'user',
        'room_types'   => 'room type',
        'servers'      => 'server',
        'server_pools' => 'server pool',
    ]
];
