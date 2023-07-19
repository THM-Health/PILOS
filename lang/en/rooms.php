<?php

return [
    'access_code'                  => 'Access code',
    'access_for_participants'      => 'Access for participants',
//    'all_rooms'                    => 'All rooms',
    'become_member'                => 'Become member',
    'copy_access_for_participants' => 'Copy access for participants to clipboard',
    'create'                       => [
        'ok'    => 'Create',
        'title' => 'Create new room',
    ],
    'end_membership' => [
        'button'  => 'End membership',
        'message' => 'You will lose the role associated with your membership. To become a member again, you may need to ask the room owner. If the room has an access code, you will need to know it to continue to have access to the room.',
        'no'      => 'No, keep membership',
        'title'   => 'Are you sure you want to end the membership?',
        'yes'     => 'Yes, end membership',
    ],
    'files' => [
        'confirm_delete' => 'Do you want to delete this file :filename?',
        'default'        => 'Default',
        'delete'         => 'Delete file',
        'downloadable'   => 'Downloadable',
        'filename'       => 'Filename',
        'formats'        => 'Allowed file formats: :formats',
        'nodata'         => 'No files available',
        'select_or_drag' => 'Select a file or drag and drop it here...',
        'size'           => 'Max. file size: :size MB',
        'terms_of_use'   => [
            'accept'  => 'I accept the terms of use',
            'content' => 'Files that can be downloaded here are for personal study only. The files, or parts of them, may not be shared or distributed.',
            'title'   => 'Terms of Use',
        ],
        'title'               => 'Files',
        'uploaded_at'         => 'Uploaded at',
        'use_in_next_meeting' => 'Use in the next meeting',
        'view'                => 'View file',
    ],
    'filter' => [
        'apply' => 'Apply',
        'title' => 'Filter',
    ],
//    'find_rooms'         => 'Find rooms',
//    'find_rooms_info'    => 'List of all public listed rooms without an access code',
    'first_and_lastname' => 'First- und last name',
    'flash'              => [
        'access_code_invalid' => 'The access code is invalid.',
        'file_forbidden'      => 'The access to the requested file was forbidden.',
        'file_gone'           => 'The file has been deleted in the meantime.',
        'no_new_room'         => 'You do not have the necessary permission to create a new room.',
        'start_forbidden'     => 'The room could not be started by you.',
        'token_invalid'       => 'The personalised room link is no longer valid.',
    ],
    'index' => [
        'room_type'   => 'Room type',
        'show_shared' => 'Show shared rooms',
        'show_all'    => 'Show all rooms',
        'sorting'     => [
            'sort'           => 'Sorting',
            'select_sorting' => '-- Select sorting --',
            'alpha_asc'      => 'Alphabetically ascending',
            'alpha_desc'     => 'Alphabetically descending',
        ],
        'room_component'=> [
            'never_started'   => ' Never started before',
            'running_since'   => ' Meeting running since :date',
            'last_ran_till'   => ' Last ran till :date',
            'meeting_starting'=> ' Meeting is starting'
        ],

    ],
    'invalid_personal_link' => 'This personalised room link is invalid.',
    'invitation'            => [
        'code' => 'Access code: :code',
        'link' => 'Link: :link',
        'room' => 'Join ":roomname" with :platform',
    ],
    'join'            => 'Join',
    'login'           => 'Login',
    'meeting_history' => [
        'title' => 'History',
    ],
    'members' => [
        'add_user'          => 'Add user',
        'bulk_edit_user'    => 'Edit :numberOfSelectedUsers members',
        'bulk_import_users' => 'Add several users',
        'bulk_remove_user'  => 'Remove :numberOfSelectedUsers members',
        'edit_user'         => 'Edit member',
        'image'             => 'Picture',
        'modals'            => [
            'add' => [
                'add'         => 'Add',
                'no_options'  => 'No entries, please search for a user.',
                'no_result'   => 'Oops! No user was found for this query.',
                'select_role' => 'Please select a role',
                'select_user' => 'Please select the user you would like to add',
            ],
            'bulk_import' => [
                'can_import_users'          => 'Users that can be added',
                'cannot_import_users'       => 'Users that can not be added',
                'copied_invalid_users'      => 'Copied invalid users',
                'copy_and_close'            => 'Copy users that could not be added and close',
                'could_not_import_users'    => 'Users that could not be added',
                'list_description'          => 'Every line represents a separate email address (maximum 1000)',
                'list_placeholder'          => 'john.doe@domain.com\njane.doe@domain.com',
                'import_importable_button'  => 'Add valid users',
                'import_importable_question'=> 'Do you want to continue to add the users that can be added?',
                'imported_users'            => 'Users that were successfully added',
                'label'                     => 'Email list'
            ],
            'edit' => [
                'title'      => 'Edit :firstname :lastname',
                'title_bulk' => 'Edit :numberOfSelectedUsers users',
            ],
            'remove' => [
                'confirm'      => 'Do you want to remove :firstname :lastname from this room?',
                'confirm_bulk' => 'Do you want to remove :numberOfSelectedUsers members from this room?',
                'title'        => 'Remove member from this room',
                'title_bulk'   => 'Remove :numberOfSelectedUsers members from this room',
            ],
        ],
        'nodata'      => 'No members available',
        'remove_user' => 'Remove member',
        'title'       => 'Members',
    ],
    'modals' => [
        'delete' => [
            'confirm' => 'Should the room ":name" be deleted?',
            'title'   => 'Delete room',
        ],
    ],
//    'my_rooms'                  => 'My rooms',
    'name'                      => 'Room name',
    'no_rooms_available'        => 'No rooms available',
    'no_rooms_available_search' => 'No rooms found for this search query',
    'not_running'               => 'This room is not started yet.',
    'notification'              => [
        'body'            => 'The room was started at :time',
        'browser_support' => 'Your browser does not support notification.',
        'denied'          => 'The browser denied notifications.',
        'enable'          => 'Notify on room start',
        'enabled'         => 'You will be notified by your browser when the room starts. Do not close this window/tab.',
    ],
    'only_used_by_authenticated_users' => 'This room can only be used by authenticated users.',
    'placeholder_name'                 => 'John Doe',
    'recording_attendance_accept'      => 'I agree with the logging.',
    'recording_attendance_info'        => 'The attendance in this room is logged.',
    'require_access_code'              => 'An access code is required to join this room',
    'role'                             => 'Role',
    'roles'                            => [
        'co_owner'    => 'Co-owner',
        'guest'       => 'Guest',
        'moderator'   => 'Moderator',
        'participant' => 'Participant',
    ],
    'room_limit'              => 'Room limit: :has/:max',
    'room_type_invalid_alert' => 'The usage of the room type :roomTypeName is only permitted for special user groups. If you are the owner of this room, please change the room type so that the room can be started again.',
    'room_types'              => [
        'loading_error' => 'An error occurred during loading of the room types.',
        'reload'        => 'Reload room types',
        'select_type'   => '-- Select room type --',
        'all'           => 'All',
    ],
    'settings' => [
        'general' => [
            'chars'           => 'Characters: :chars',
            'max_duration'    => 'Max. duration',
            'minutes'         => 'min.',
            'reset_duration'  => 'Reset duration',
            'title'           => 'General',
            'type'            => 'Type',
            'welcome_message' => 'Welcome message',
        ],
        'none_placeholder' => '-- none --',
        'participants'     => [
            'clear_max_participants' => 'Reset max. participants',
            'default_role'           => [
                'only_logged_in' => '(only for authenticated users)',
                'title'          => 'Default role',
            ],
            'max_participants'  => 'Max. participants',
            'record_attendance' => 'Log attendance of participants',
            'title'             => 'Participants',
            'waiting_room'      => [
                'only_for_guests_enabled' => 'Enabled only for guests',
                'title'                   => 'Waiting room',
            ],
        ],
        'permissions' => [
            'everyone_start' => 'Everyone can start the meeting',
            'mute_mic'       => 'Mute microphone on join',
            'title'          => 'Permissions',
        ],
        'restrictions' => [
            'disable_cam'            => 'Disable webcam',
            'disable_mic'            => 'Disable microphone',
            'disable_note_edit'      => 'Disable editing of notes',
            'disable_private_chat'   => 'Disable private chat',
            'disable_public_chat'    => 'Disable public chat',
            'enabled'                => 'Enabled restrictions',
            'hide_participants_list' => 'Hide list of participants',
            'only_mod_see_cam'       => 'Only moderators can see the webcam',
            'title'                  => 'Restrictions',
        ],
        'security' => [
            'access_code_note'        => 'Access restriction for joining the room and room membership (if enabled).',
            'allow_guests'            => 'Allow guests',
            'allow_new_members'       => 'Allow new members',
            'delete_access_code'      => 'Remove access code',
            'generate_access_code'    => 'Create new access code',
            'listed'                  => 'Include in room search',
            'unprotected_placeholder' => '-- unprotected --',
        ],
        'title' => 'Settings',
    ],
//    'shared_by'    => 'Shared by :name',
//    'shared_rooms' => 'Rooms shared with me',
    'start'        => 'Start',
    'status'       => [
        'not_running' => 'No running meeting',
        'running'     => 'Meeting running',
    ],
    'tokens' => [
        'add'              => 'Add personalized room link',
        'confirm_delete'   => 'Do you really want to delete the personalized room link for :firstname :lastname?',
        'copy'             => 'Copy personalized room link to clipboard',
        'delete'           => 'Delete personalized room link',
        'edit'             => 'Edit personalized room link',
        'expires'          => 'Expiry date',
        'last_usage'       => 'Last used',
        'nodata'           => 'No personalized room links available!',
        'room_link_copied' => 'The personalized room link for :firstname :lastname was copied to your clipboard.',
        'title'            => 'Personalized room links',
    ],
    'try_again'   => 'Try again',
    'description' => [
        'cancel' => 'Cancel',
        'color'  => [
            'black' => 'Black',
            'blue'  => 'Blue',
            'green' => 'Green',
            'red'   => 'Red',
        ],
        'edit'      => 'Edit',
        'heading1'  => 'Heading 1',
        'heading2'  => 'Heading 2',
        'heading3'  => 'Heading 3',
        'highlight' => [
            'green'  => 'Green',
            'red'    => 'Red',
            'yellow' => 'Yellow',
        ],
        'modals' => [
            'link' => [
                'new'         => 'Add new link',
                'edit'        => 'Edit link',
                'url'         => 'URL',
                'invalid_url' => 'The URL must start with http://, https:// or mailto://',
            ],
            'image' => [
                'new'               => 'Add new image',
                'edit'              => 'Edit image',
                'src'               => 'URL',
                'invalid_src'       => 'The URL must start with http:// or https://',
                'width'             => 'Width',
                'width_description' => 'Width in pixels (px) or percent (%)',
                'alt'               => 'Alternative text',
            ],
            'source_code' => [
                'title' => 'Edit source code',
            ],
        ],
        'external_link_warning' => [
            'title'       => 'External link',
            'description' => 'You are beeing redirected to the following URL :link',
        ],
        'missing'   => 'No description available',
        'paragraph' => 'Paragraph',
        'save'      => 'Save',
        'title'     => 'Description',
        'tooltips'  => [
            'text_type'     => 'Text type',
            'bold'          => 'Bold',
            'italic'        => 'Italic',
            'underline'     => 'Underline',
            'strikethrough' => 'Strikethrough',
            'color'         => 'Text color',
            'highlight'     => 'Highlight text',
            'clear'         => 'Clear formatting',
            'center'        => 'Align center',
            'left'          => 'Align left',
            'right'         => 'Align right',
            'list'          => 'List',
            'numbered_list' => 'Numbered list',
            'quote'         => 'Quote',
            'link'          => 'Link',
            'image'         => 'Image',
            'undo'          => 'Undo',
            'redo'          => 'Redo',
            'delete'        => 'Delete content',
            'source_code'   => 'Source code',
        ],
    ],
];
