<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted'        => 'The :attribute must be accepted.',
    'active_url'      => 'The :attribute is not a valid URL.',
    'after'           => 'The :attribute must be a date after :date.',
    'after_or_equal'  => 'The :attribute must be a date after or equal to :date.',
    'alpha'           => 'The :attribute must only contain letters.',
    'alpha_dash'      => 'The :attribute must only contain letters, numbers, dashes and underscores.',
    'alpha_num'       => 'The :attribute must only contain letters and numbers.',
    'array'           => 'The :attribute must be an array.',
    'before'          => 'The :attribute must be a date before :date.',
    'before_or_equal' => 'The :attribute must be a date before or equal to :date.',
    'between'         => [
        'numeric' => 'The :attribute must be between :min and :max.',
        'file'    => 'The :attribute must be between :min and :max kilobytes.',
        'string'  => 'The :attribute must be between :min and :max characters.',
        'array'   => 'The :attribute must have between :min and :max items.',
    ],
    'boolean'          => 'The :attribute field must be true or false.',
    'confirmed'        => 'The :attribute confirmation does not match.',
    'current_password' => 'The current password is incorrect.',
    'date'             => 'The :attribute is not a valid date.',
    'date_equals'      => 'The :attribute must be a date equal to :date.',
    'date_format'      => 'The :attribute does not match the format :format.',
    'different'        => 'The :attribute and :other must be different.',
    'digits'           => 'The :attribute must be :digits digits.',
    'digits_between'   => 'The :attribute must be between :min and :max digits.',
    'dimensions'       => 'The :attribute has invalid image dimensions.',
    'distinct'         => 'The :attribute field has a duplicate value.',
    'email'            => 'The :attribute must be a valid email address.',
    'ends_with'        => 'The :attribute must end with one of the following: :values.',
    'exists'           => 'The selected :attribute is invalid.',
    'file'             => 'The :attribute must be a file.',
    'filled'           => 'The :attribute field must have a value.',
    'gt'               => [
        'numeric' => 'The :attribute must be greater than :value.',
        'file'    => 'The :attribute must be greater than :value kilobytes.',
        'string'  => 'The :attribute must be greater than :value characters.',
        'array'   => 'The :attribute must have more than :value items.',
    ],
    'gte' => [
        'numeric' => 'The :attribute must be greater than or equal :value.',
        'file'    => 'The :attribute must be greater than or equal :value kilobytes.',
        'string'  => 'The :attribute must be greater than or equal :value characters.',
        'array'   => 'The :attribute must have :value items or more.',
    ],
    'image'    => 'The :attribute must be an image.',
    'in'       => 'The selected :attribute is invalid.',
    'in_array' => 'The :attribute field does not exist in :other.',
    'integer'  => 'The :attribute must be an integer.',
    'ip'       => 'The :attribute must be a valid IP address.',
    'ipv4'     => 'The :attribute must be a valid IPv4 address.',
    'ipv6'     => 'The :attribute must be a valid IPv6 address.',
    'json'     => 'The :attribute must be a valid JSON string.',
    'lt'       => [
        'numeric' => 'The :attribute must be less than :value.',
        'file'    => 'The :attribute must be less than :value kilobytes.',
        'string'  => 'The :attribute must be less than :value characters.',
        'array'   => 'The :attribute must have less than :value items.',
    ],
    'lte' => [
        'numeric' => 'The :attribute must be less than or equal :value.',
        'file'    => 'The :attribute must be less than or equal :value kilobytes.',
        'string'  => 'The :attribute must be less than or equal :value characters.',
        'array'   => 'The :attribute must not have more than :value items.',
    ],
    'max' => [
        'numeric' => 'The :attribute must not be greater than :max.',
        'file'    => 'The :attribute must not be greater than :max kilobytes.',
        'string'  => 'The :attribute must not be greater than :max characters.',
        'array'   => 'The :attribute must not have more than :max items.',
    ],
    'mimes'     => 'The :attribute must be a file of type: :values.',
    'mimetypes' => 'The :attribute must be a file of type: :values.',
    'min'       => [
        'numeric' => 'The :attribute must be at least :min.',
        'file'    => 'The :attribute must be at least :min kilobytes.',
        'string'  => 'The :attribute must be at least :min characters.',
        'array'   => 'The :attribute must have at least :min items.',
    ],
    'multiple_of'          => 'The :attribute must be a multiple of :value.',
    'not_in'               => 'The selected :attribute is invalid.',
    'not_regex'            => 'The :attribute format is invalid.',
    'numeric'              => 'The :attribute must be a number.',
    'password'             => 'The password is incorrect.',
    'present'              => 'The :attribute field must be present.',
    'regex'                => 'The :attribute format is invalid.',
    'required'             => 'The :attribute field is required.',
    'required_if'          => 'The :attribute field is required when :other is :value.',
    'required_unless'      => 'The :attribute field is required unless :other is in :values.',
    'required_with'        => 'The :attribute field is required when :values is present.',
    'required_with_all'    => 'The :attribute field is required when :values are present.',
    'required_without'     => 'The :attribute field is required when :values is not present.',
    'required_without_all' => 'The :attribute field is required when none of :values are present.',
    'prohibited'           => 'The :attribute field is prohibited.',
    'prohibited_if'        => 'The :attribute field is prohibited when :other is :value.',
    'prohibited_unless'    => 'The :attribute field is prohibited unless :other is in :values.',
    'same'                 => 'The :attribute and :other must match.',
    'size'                 => [
        'numeric' => 'The :attribute must be :size.',
        'file'    => 'The :attribute must be :size kilobytes.',
        'string'  => 'The :attribute must be :size characters.',
        'array'   => 'The :attribute must contain :size items.',
    ],
    'starts_with' => 'The :attribute must start with one of the following: :values.',
    'string'      => 'The :attribute must be a string.',
    'timezone'    => 'The :attribute must be a valid timezone.',
    'unique'      => 'The :attribute has already been taken.',
    'uploaded'    => 'The :attribute failed to upload.',
    'url'         => 'The :attribute must be a valid URL.',
    'uuid'        => 'The :attribute must be a valid UUID.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
        'locale' => [
            'in' => 'The selected language isn\'t supported by the server.'
        ],
        'user' => [
            'exists' => 'The selected user could not be found.'
        ],
        'room' => [
            'already_member' => 'The user is already member of the room.'
        ],
        'password'              => 'The password must contain at least one character from each of the following four categories: Uppercase letter (A - Z), lowercase letter (a - z), number (0 - 9), non-alphanumeric character (for example: !, $, #, or %).',
        'replacement_room_type' => [
            'required' => 'Replacement room type required! Rooms are still assigned to this room type.',
            'exists'   => 'Replacement room type invalid! A replacement room type is required because rooms are still assigned to this room type.',
            'not_in'   => 'Replacement room type invalid! A replacement room type is required because rooms are still assigned to this room type.',
        ],
        'banner' => [
            'array'    => 'The message banner settings are missing!',
            'required' => 'The message banner settings are missing!',
        ],
        'banner.icon' => [
            'regex' => 'The icon css class should be in the following format: `fas fa-camera`. The class `fas` depends on the selected type and can also be for example `fab`.'
        ],
        'color'     => ':attribute must be a color specified as a hexadecimal number (z. B. #fff oder #ffffff)!',
        'servers.*' => [
            'exists'   => 'The server with the ID :input could not be found.',
            'distinct' => 'The server with the ID :input was selected more than once.'
        ],
        'roles.*' => [
            'exists'   => 'One of the selected roles does not exist.',
            'distinct' => 'At least one role was provided multiple times.'
        ],
        'invalid_room_type' => 'You have not the necessary permissions to have a room with the passed room type.'
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'name'                               => 'Name',
        'user'                               => 'User',
        'username'                           => 'Username',
        'email'                              => 'Email',
        'first_name'                         => 'First name',
        'last_name'                          => 'Last name',
        'password'                           => 'Password',
        'current_password'                   => 'Current password',
        'new_password'                       => 'New password',
        'new_password_confirmation'          => 'New password confirmation',
        'password_confirmation'              => 'Password confirmation',
        'city'                               => 'City',
        'country'                            => 'Country',
        'address'                            => 'Adress',
        'phone'                              => 'Phone',
        'mobile'                             => 'Mobile',
        'age'                                => 'Age',
        'sex'                                => 'Sex',
        'gender'                             => 'Gender',
        'day'                                => 'Day',
        'month'                              => 'Month',
        'year'                               => 'Year',
        'hour'                               => 'Hour',
        'minute'                             => 'Minute',
        'second'                             => 'Second',
        'title'                              => 'Title',
        'content'                            => 'Content',
        'description'                        => 'Description',
        'excerpt'                            => 'Excerpt',
        'date'                               => 'Date',
        'time'                               => 'Time',
        'available'                          => 'Available',
        'size'                               => 'Size',
        'welcome'                            => 'Welcome message',
        'room_type'                          => 'Room type',
        'default_role'                       => 'Default role',
        'duration'                           => 'Max. duration',
        'access_code'                        => 'Access code',
        'allow_guests'                       => 'Allow guests',
        'allow_membership'                   => 'Allow new members',
        'max_participants'                   => 'Max. participants',
        'lobby'                              => 'Waiting room',
        'everyone_can_start'                 => 'Everyone can start the meeting',
        'mute_on_start'                      => 'Mute microphone on join',
        'lock_settings_lock_on_join'         => 'Enabled restrictions',
        'lock_settings_disable_cam'          => 'Disable webcam',
        'webcams_only_for_moderator'         => 'Only moderators can see the webcam',
        'lock_settings_disable_mic'          => 'Disable microphone',
        'lock_settings_disable_note'         => 'Disable editing of notes',
        'lock_settings_disable_private_chat' => 'Disable private chat',
        'lock_settings_disable_public_chat'  => 'Disable public chat',
        'lock_settings_hide_user_list'       => 'Hide list of participants',
        'role'                               => 'Role',
        'file'                               => 'File',
        'permissions'                        => 'Permissions',
        'updated_at'                         => 'Updated at',
        'room_limit'                         => 'Room limit',
        'roles'                              => 'Roles',
        'bbb_skip_check_audio'               => 'Disable echo audio test',
        'firstname'                          => 'Firstname',
        'lastname'                           => 'Lastname',
        'user_locale'                        => 'Language',
        'banner.enabled'                     => 'Show',
        'banner.message'                     => 'Message',
        'banner.color'                       => 'Text color of the banner',
        'banner.background'                  => 'Background color of the banner',
        'banner.title'                       => 'Title',
        'banner.link'                        => 'Link to show after the message',
        'banner.icon'                        => 'Icon',
        'banner.link_text'                   => 'Link text',
        'banner.link_target'                 => 'Link target',
        'banner.link_style'                  => 'Link style',
        'servers'                            => 'Server',
        'strength'                           => 'Server strength',
        'base_url'                           => 'API endpoint',
        'salt'                               => 'API secret',
        'server_pool'                        => 'Server pool',
        'icon_text'                          => 'Icon text',
        'color'                              => 'Color',
        'allow_listing'                      => 'Room search allowed',
        'listed'                             => 'Include in room search',
        'password_self_reset_enabled'        => 'Give registered users the possibility to reset and change their password',
        'timezone'                           => 'Timezone',
        'default_timezone'                   => 'Default timezone',
        'default_presentation'               => 'Default presentation',
        'help_url'                           => 'URL to the help',
        'restrict'                           => 'Restrict usage',
        'room_token_expiration'              => 'Expiration time for personalized room links'
    ],

    'validname'       => ':attribute contains the following non-permitted characters: :chars',
    'validname_error' => ':attribute contains non-permitted characters'
];
