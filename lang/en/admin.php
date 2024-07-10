<?php

return [
    'home_button' => 'Back to the overview',
    'overview' => 'Overview',
    'overview_description' => 'Here you can manage the settings of the application. Please select one of the menu items on the left to adjust the settings.',
    'roles' => [
        'default' => 'Default',
        'delete' => [
            'confirm' => 'Do you really want to delete the role :name?',
            'item' => 'Delete role :id',
            'title' => 'Delete role?',
        ],
        'edit' => 'Edit role :name',
        'has_included_permission' => 'The permission ":name" was either explicitly selected or is included in another selected permission.',
        'has_not_included_permission' => 'The permission ":name" was neither explicitly selected nor is it included in another selected permission.',
        'new' => 'Create new role',
        'no_data' => 'No roles found!',
        'no_data_filtered' => 'For the filter query no roles were found!',
        'no_options' => 'No permissions found!',
        'permission_explicit' => 'Explicit',
        'permission_included' => 'Included',
        'permission_included_help' => 'Permissions that have been selected and permissions that are included in the selected permissions.',
        'permission_name' => 'Name of the permissions',
        'permissions' => [
            'admin' => [
                'title' => 'Admin',
                'view' => 'Access admin panel',
            ],
            'meetings' => [
                'title' => 'Meetings',
                'view_any' => 'Show all meetings',
            ],
            'roles' => [
                'create' => 'Create roles',
                'delete' => 'Delete roles',
                'title' => 'Roles',
                'update' => 'Edit roles',
                'view' => 'Show roles',
                'view_any' => 'Show all roles',
            ],
            'room_types' => [
                'create' => 'Create room types',
                'delete' => 'Delete room types',
                'title' => 'Room types',
                'update' => 'Edit room types',
                'view' => 'Show room types',
            ],
            'rooms' => [
                'create' => 'Create rooms',
                'manage' => 'Manage all rooms',
                'title' => 'Rooms',
                'view_all' => 'Show all rooms',
            ],
            'server_pools' => [
                'create' => 'Create server pools',
                'delete' => 'Delete server pools',
                'title' => 'Server pools',
                'update' => 'Edit server pools',
                'view' => 'Show server pools',
                'view_any' => 'Show all server pools',
            ],
            'servers' => [
                'create' => 'Create servers',
                'delete' => 'Delete servers',
                'title' => 'Servers',
                'update' => 'Edit servers',
                'view' => 'Show servers',
                'view_any' => 'Show all servers',
            ],
            'settings' => [
                'title' => 'Settings',
                'update' => 'Edit settings',
                'view_any' => 'Show all settings',
            ],
            'system' => [
                'monitor' => 'Monitoring',
                'title' => 'System',
            ],
            'users' => [
                'create' => 'Create users',
                'delete' => 'Delete users',
                'title' => 'Users',
                'update' => 'Edit users',
                'update_own_attributes' => 'Update own firstname, lastname and email',
                'view' => 'Show users',
                'view_any' => 'Show all users',
            ],
        ],
        'permissions_title' => 'Permissions',
        'room_limit' => [
            'custom' => 'Custom amount',
            'default' => 'System default (:value)',
            'help_modal' => [
                'examples' => 'Examples',
                'info' => 'The room limit of a user results from the maximum of the room limits of the roles a user belongs to.',
                'note' => 'X: User is not member of this role',
                'role_a' => 'Role A',
                'role_b' => 'Role B',
                'system_default' => 'System default',
            ],
        ],
        'select_roles' => 'Please select at least one role',
        'tile_description' => 'The roles assign permissions, organise the users and define the maximum number of rooms per user.',
        'view' => 'Detailed information for the role :name',
    ],
    'room_types' => [
        'bbb_api' => [
            'create_parameters' => 'Additional Create API parameters',
            'create_parameters_description' => 'Specify as attribute-value pair (one per line, without spaces), e.g. webcamsOnlyForModerator=true',
            'title' => 'BigBlueButton API',
        ],
        'color' => 'Color',
        'custom_color' => 'Custom color',
        'default_room_settings' => [
            'default' => 'Default',
            'enforced' => 'Enforced',
            'title' => 'Default room settings',
        ],
        'delete' => [
            'confirm' => 'Do you really want to delete the room type :name?',
            'item' => 'Delete room type :id',
            'no_replacement' => '-- No replacement --',
            'replacement' => 'Room type replacement',
            'replacement_info' => 'If there are rooms associated with this room type, you need to select a replacement room type.',
            'title' => 'Delete room type?',
        ],
        'edit' => 'Edit room type :name',
        'max_duration' => 'Maximum duration',
        'max_participants' => 'Maximum number of participants',
        'missing_description' => 'No description available!',
        'new' => 'Create new room type',
        'no_data' => 'No room types found!',
        'no_data_filtered' => 'For the filter query no room types were found!',
        'preview' => 'Preview',
        'restrict' => 'Restrict usage',
        'restrict_description' => 'The usage of this room type and the corresponding servers will be restricted to the selected roles.',
        'select_roles' => 'Select roles',
        'select_server_pool' => 'Select server pool',
        'server_pool_description' => 'Servers of this server pool are used for load balancing',
        'tile_description' => 'The room types organize the rooms, give them icons for quicker recognition and determine on which server pool a meeting takes place.',
        'view' => 'Detailed information for the room type :name',
    ],
    'server_pools' => [
        'delete' => [
            'confirm' => 'Are you really want to delete the server pool :name?',
            'failed' => 'Server pool can\'t be deleted because the following room types still use it:',
            'item' => 'Delete server pool :name',
            'title' => 'Delete server pool?',
        ],
        'edit' => 'Edit server pool :name',
        'new' => 'Create new server pool',
        'no_data' => 'No server pools found!',
        'no_data_filtered' => 'For the filter query no server pools were found!',
        'remove_server' => 'Remove server',
        'select_servers' => 'Select server',
        'server_count' => 'Number of servers',
        'tile_description' => 'For load balancing several servers are bundled and assigned to each room via the room type.',
        'view' => 'Detailed information for the server pool :name',
    ],
    'servers' => [
        'base_url' => 'API endpoint',
        'connection' => 'Connection',
        'current_usage' => 'Current usage',
        'delete' => [
            'confirm' => 'Do you really want to delete the server :name?',
            'item' => 'Delete server :name',
            'title' => 'Delete server?',
        ],
        'disabled' => 'Disabled',
        'disabled_description' => 'Currently running meetings are not stopped if server gets disabled, but no new meetings are started',
        'draining' => 'Draining',
        'edit' => 'Edit server :name',
        'enabled' => 'Enabled',
        'flash' => [
            'panic' => [
                'description' => ':total meetings were found and :success were successfully stopped.',
                'title' => 'The server has been disabled.',
            ],
        ],
        'hide_secret' => 'Hide clear text',
        'meeting_count' => 'Meetings',
        'meeting_description' => 'All meetings on the BigBlueButton-Server',
        'new' => 'Add new server',
        'no_data' => 'No servers found!',
        'no_data_filtered' => 'For the filter query no servers were found!',
        'offline' => 'Offline',
        'offline_reason' => [
            'connection' => 'No connection could be established to the server.',
            'secret' => 'A connection to the server could be established, but the API secret is invalid.',
        ],
        'online' => 'Online',
        'own_meeting_count' => 'Own meetings',
        'own_meeting_description' => 'Meetings that are managed by this system',
        'panic' => 'Disable & cleanup',
        'panic_description' => 'Only meetings managed by this system are stopped!',
        'panic_server' => 'Disable server and end all meetings',
        'participant_count' => 'Participants',
        'reload' => 'Recalculate usage',
        'secret' => 'API secret',
        'show_secret' => 'Show clear text',
        'status' => 'Status',
        'strength' => 'Server strength',
        'strength_description' => 'Load balancing factor; the higher the factor, the more participants and meetings the server can handle',
        'test_connection' => 'Test connection',
        'tile_description' => 'The servers provide the BBB infrastructure for the meetings.',
        'unhealthy' => 'Faulty',
        'unknown' => 'Unknown',
        'usage_info' => 'The usage (meetings, participants, videos) also contains meetings that are managed by other systems.',
        'version' => 'Version',
        'video_count' => 'Videos',
        'view' => 'Detailed information for the server :name',
    ],
    'settings' => [
        'application' => 'Application',
        'attendance' => [
            'retention_period_title' => 'Retention period of the attendance logging in days',
        ],
        'attendance_and_statistics_title' => 'Attendance and statistics',
        'banner' => [
            'background' => 'Background color of the banner',
            'banner_title' => 'Title',
            'color' => 'Text color of the banner',
            'enabled' => 'Show',
            'icon' => 'Icon',
            'icon_description' => 'The CSS class of the Fontawesome-Icon (e. g. `fa-solid fa-door-open`). The icon will only be visible, if a title is supplied.',
            'link' => 'Link to show after the message',
            'link_style' => 'Link style',
            'link_target' => 'Link target',
            'link_text' => 'Link text',
            'message' => 'Message',
            'preview' => 'Preview',
            'select_link_style' => 'Select link style',
            'select_link_target' => 'Select link target',
            'title' => 'Banner for messages',
        ],
        'bbb' => [
            'logo' => [
                'alt' => 'Logo preview',
                'hint' => 'https://domain.tld/path/logo.svg',
                'select_file' => 'Select logo file',
                'title' => 'Logo',
                'upload_title' => 'Upload a logo (max. 500 KB)',
                'url_title' => 'URL to logo file',
            ],
            'style' => [
                'title' => 'CSS style file',
            ],
            'title' => 'BigBlueButton Customization',
        ],
        'default_presentation' => 'Default presentation',
        'default_timezone' => 'Default timezone',
        'favicon' => [
            'alt' => 'Favicon preview',
            'hint' => 'https://domain.tld/path/favicon.ico',
            'select_file' => 'Select favicon file',
            'title' => 'Favicon',
            'upload_title' => 'Upload a favicon (max. 500 KB, Format: .ico)',
            'url_title' => 'URL to favicon file',
        ],
        'help_url' => [
            'description' => 'If not set, no help button will be displayed.',
            'title' => 'URL to the help page',
        ],
        'legal_notice_url' => [
            'description' => 'If not set, no legal notice link will be displayed in the footer.',
            'title' => 'URL to the legal notice',
        ],
        'logo' => [
            'alt' => 'Logo preview',
            'hint' => 'https://domain.tld/path/logo.svg',
            'select_file' => 'Select logo file',
            'title' => 'Logo',
            'upload_title' => 'Upload a logo (max. 500 KB)',
            'url_title' => 'URL to logo file',
        ],
        'name' => [
            'description' => 'Changes the site title',
            'title' => 'Name of the application',
        ],
        'never' => 'Never',
        'one_day' => '1 Day (24 Hours)',
        'one_month' => '1 Month (30 Days)',
        'one_week' => '1 Week (7 Day)',
        'one_year' => '1 Year (365 Days)',
        'pagination_page_size' => [
            'description' => 'Number of records displayed simultaneously in tables',
            'title' => 'Pagination page size',
        ],
        'password_change_allowed' => 'Give local users the possibility to change their password',
        'privacy_policy_url' => [
            'description' => 'If not set, no privacy policy link will be displayed in the footer.',
            'title' => 'URL to the privacy policy',
        ],
        'recording' => [
            'retention_period_title' => 'Storage duration of the recordings in days',
        ],
        'room_auto_delete' => [
            'deadline_period' => [
                'description' => 'Period between delivery of the information email and the deletion',
                'title' => 'Deadline for deletion',
            ],
            'enabled' => [
                'title' => 'Automatically delete unused rooms',
            ],
            'inactive_period' => [
                'description' => 'Rooms where the last meeting was longer ago than the period',
                'title' => 'Period until inactive rooms are deleted',
            ],
            'never_used_period' => [
                'description' => 'Rooms that were created before the period but have not been used yet',
                'title' => 'Period until never used rooms are deleted',
            ],
        ],
        'room_limit' => [
            'description' => 'Limits the number of rooms a user can have. This setting is overwritten by the group-specific limits.',
            'title' => 'Number of rooms per user',
        ],
        'room_pagination_page_size' => [
            'description' => 'Number of rooms displayed simultaneously on the home page',
            'title' => 'Room pagination page size',
        ],
        'room_token_expiration' => [
            'description' => 'Time period since last usage, after which personalized room links gets automatically removed.',
            'title' => 'Expiration time for personalized room links',
        ],
        'six_month' => '6 Months (180 Days)',
        'statistics' => [
            'meetings' => [
                'enabled_title' => 'Record utilisation of meetings',
                'retention_period_title' => 'Retention period of the meeting utilisation in days',
            ],
            'servers' => [
                'enabled_title' => 'Record server utilisation',
                'retention_period_title' => 'Retention period of the server utilisation in days',
            ],
        ],
        'three_month' => '3 Months (90 Days)',
        'tile_description' => 'Controls system-wide settings such as logo, maintenance banner and page sizes.',
        'title' => 'Settings',
        'toast_lifetime' => [
            'custom' => 'Custom',
            'description' => 'Time in seconds for which a notification is displayed',
            'title' => 'Display duration of pop-up messages',
        ],
        'two_weeks' => '2 Weeks (14 Days)',
        'two_years' => '2 Year (730 Days)',
        'user_settings' => 'User settings',
    ],
    'title' => 'Administration',
    'users' => [
        'authenticator' => [
            'ldap' => 'LDAP',
            'local' => 'Local',
            'shibboleth' => 'Shibboleth',
            'title' => 'Authentication Type',
        ],
        'base_data' => 'Base data',
        'bbb' => 'BigBlueButton',
        'delete' => [
            'confirm' => 'Are you really want to delete the user :firstname :lastname?',
            'item' => 'Delete user :firstname :lastname',
            'title' => 'Delete user?',
        ],
        'edit' => 'Edit user :firstname :lastname',
        'email' => 'Email',
        'generate_password' => 'Generate password',
        'generate_password_description' => 'A generated password will be set and an email with a reset link will be sent to the user. The user will be automatically deleted, if he doesn\'t change his password in the given time.',
        'hide_password' => 'Hide password',
        'image' => [
            'crop' => 'Crop profile picture',
            'delete' => 'Delete picture',
            'invalid_mime' => 'The file format is not supported. Please select a jpg or png file.',
            'save' => 'Confirm',
            'title' => 'Profile picture',
            'upload' => 'Upload new picture',
        ],
        'new' => 'Create new user',
        'no_data' => 'No users found!',
        'no_data_filtered' => 'For the filter query no users were found!',
        'other_settings' => 'Other settings',
        'password_reset_success' => 'Password reset mail was successfully send to :mail!',
        'remove_role' => 'Remove role',
        'reset_password' => [
            'confirm' => 'Are you really want to reset the password for :firstname :lastname?',
            'item' => 'Reset password for the user :firstname :lastname',
            'title' => 'Reset password?',
        ],
        'role_filter' => 'Select role for filtering',
        'roles_and_permissions' => 'Roles and permissions',
        'show_password' => 'Show password',
        'skip_check_audio' => 'Disable echo audio test',
        'tile_description' => 'Users can login to the system and use different features depending on their role.',
        'timezone' => 'Timezone',
        'user_locale' => 'Language',
        'view' => 'Detailed information for the user :firstname :lastname',
    ],
];