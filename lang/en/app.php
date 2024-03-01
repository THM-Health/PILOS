<?php

return [
    'actions'       => 'Actions',
    'back'          => 'Back',
    'browse'        => 'Browse',
    'button_styles' => [
        'danger'    => 'Danger',
        'dark'      => 'Dark',
        'info'      => 'Info',
        'light'     => 'Light',
        'link'      => 'Link',
        'primary'   => 'Primary',
        'secondary' => 'Secondary',
        'success'   => 'Success',
        'warning'   => 'Warning',
    ],
    'cancel'      => 'Cancel',
    'close'       => 'Close',
    'continue'    => 'Continue',
    'delete'      => 'Delete',
    'description' => 'Description',
    'disable'     => 'Disable',
    'disabled'    => 'Disabled',
    'email'       => 'Email',
    'enable'      => 'Enable',
    'enabled'     => 'Enabled',
    'error'       => 'An error occurred',
    'errors'      => [
        'attendance_agreement_missing' => 'Consent to record attendance is required.',
        'file_not_found'               => 'The file could not be found.',
        'meeting_attendance_disabled'  => 'The logging of attendance is unavailable.',
        'meeting_attendance_not_ended' => 'The logging of attendance is not yet completed for this room.',
        'meeting_statistics_disabled'  => 'The usage data is unavailable.',
        'membership_disabled'          => 'Membership failed! Membership for this room is currently not available.',
        'no_room_access'               => 'You does not have the necessary permissions, to edit this room.',
        'no_server_available'          => 'Currently there are no servers available.',
        'not_member_of_room'           => 'The person is not a member of this room (anymore).',
        'not_running'                  => 'Joining the room has failed as it is currently closed.',
        'role_delete_linked_users'     => 'The role is linked to users and therefore it can\'t be deleted!',
        'role_update_permission_lost'  => 'The changes of the role would lead to a lost of permissions to view and update roles for you!',
        'room_limit_exceeded'          => 'Creating room failed! You have reached the max. amount of rooms.',
        'room_start'                   => 'Starting failed! The room could not be started.',
        'room_type_invalid'            => 'The type of the room is restricted for special user groups. Please change the room type to start the room, if you are the owner if this room.',
        'server_delete_failed'         => 'The server could not be deleted. To delete the server, it must be deactivated and no meetings must be running.',
        'server_pool_delete_failed'    => 'The server pool could not be deleted. To delete the server pool, it must not be used by any room type.',
        'stale_model'                  => 'The :model entity was updated in the meanwhile!',
        'token_not_found'              => 'The personalized room link could not be found.',
    ],
    'firstname' => 'Firstname',
    'flash'     => [
        'client_error' => 'An unknown error occurred in the application!',
        'guests_only'  => 'The request can only be made by guests!',
        'server_error' => [
            'empty_message' => 'An error occurred on the server during request!',
            'error_code'    => 'Error code: :statusCode',
            'message'       => ':message',
        ],
        'too_large'         => 'The transmitted data was too large!',
        'too_many_requests' => 'Too many requests. Please try again later.',
        'unauthenticated'   => 'You must be authenticated to execute the request!',
        'unauthorized'      => 'You don\'t have the necessary rights to access the called route!',
    ],
    'footer' => [
        'legal_notice'   => 'Legal notice',
        'privacy_policy' => 'Privacy policy',
    ],
    'help'         => 'Do you need help?',
    'home'         => 'Home',
    'id'           => 'ID',
    'lastname'     => 'Lastname',
    'link_targets' => [
        'blank' => 'Open in a new tab',
        'self'  => 'Open in current tab',
    ],
    'model' => [
        'roles'        => 'role',
        'room_types'   => 'room type',
        'server_pools' => 'server pool',
        'servers'      => 'server',
        'users'        => 'user',
    ],
    'model_name'  => 'Name',
    'next'        => 'Next',
    'next_page'   => 'Next page',
    'no'          => 'No',
    'not_found'   => '404 | The requested address was not found',
    'overwrite'   => 'Overwrite',
    'permissions' => [
        'application_settings' => [
            'title'    => 'Application',
            'update'   => 'Edit settings',
            'view_any' => 'Show all settings',
        ],
        'meetings' => [
            'title'    => 'Meetings',
            'view_any' => 'Show all meetings',
        ],
        'roles' => [
            'create'   => 'Create roles',
            'delete'   => 'Delete roles',
            'title'    => 'Roles',
            'update'   => 'Edit roles',
            'view'     => 'Show roles',
            'view_any' => 'Show all roles',
        ],
        'room_types' => [
            'create' => 'Create room types',
            'delete' => 'Delete room types',
            'title'  => 'Room types',
            'update' => 'Edit room types',
            'view'   => 'Show room types',
        ],
        'rooms' => [
            'create'   => 'Create rooms',
            'manage'   => 'Manage all rooms',
            'title'    => 'Rooms',
            'view_all' => 'Show all rooms',
        ],
        'server_pools' => [
            'create'   => 'Create server pools',
            'delete'   => 'Delete server pools',
            'title'    => 'Server pools',
            'update'   => 'Edit server pools',
            'view'     => 'Show server pools',
            'view_any' => 'Show all server pools',
        ],
        'servers' => [
            'create'   => 'Create servers',
            'delete'   => 'Delete servers',
            'title'    => 'Servers',
            'update'   => 'Edit servers',
            'view'     => 'Show servers',
            'view_any' => 'Show all servers',
        ],
        'settings' => [
            'manage' => 'Manage settings',
            'title'  => 'Settings',
        ],
        'system' => [
            'monitor' => 'Monitoring',
            'title'   => 'System',
        ],
        'users' => [
            'create'                => 'Create users',
            'delete'                => 'Delete users',
            'title'                 => 'Users',
            'update'                => 'Edit users',
            'update_own_attributes' => 'Update own firstname, lastname and email',
            'view'                  => 'Show users',
            'view_any'              => 'Show all users',
        ],
    ],
    'previous_page' => 'Previous page',
    'profile'       => 'Profile',
    'reload'        => 'Reload',
    'reset'         => 'Reset',
    'roles'         => 'Roles',
    'room_limit'    => 'Room limit',
    'room_types'    => 'Room types',
    'rooms'         => 'Rooms',
    'save'          => 'Save',
    'search'        => 'Search',
    'security'      => 'Security',
    'select_locale' => 'Please select a language',
    'server'        => 'Server',
    'server_pool'   => 'Server pool',
    'server_pools'  => 'Server pools',
    'servers'       => 'Server',
    'undo_delete'   => 'Undo deletion',
    'unlimited'     => 'Unlimited',
    'user'          => 'User',
    'user_name'     => 'Name',
    'users'         => 'Users',
    'validation'    => [
        'too_large'    => 'The selected file is too large.',
        'invalid_type' => 'The file type is not allowed.',
    ],
    'verify_email' => [
        'fail'    => 'Your email address could not be verified!',
        'invalid' => 'The verification link is invalid or has expired!',
        'success' => 'Your email address was successfully verified!',
        'title'   => 'Email verification',
    ],
    'version' => 'Version',
    'view'    => 'View',
    'wait'    => 'Please wait...',
    'yes'     => 'Yes',
];
