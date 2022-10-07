<?php

return [
    'greeting'   => 'Hello :name,',
    'regards'    => 'Regards',
    'action_url' => 'If you’re having trouble clicking the ":actionText" button, copy and paste the URL below into your web browser:',

    'password_reset' => [
        'subject'     => 'Reset Password Notification',
        'description' => 'You are receiving this email because we received a password reset request for your account.',
        'action'      => 'Reset Password',
        'expire'      => 'This password reset link will expire at :date.',
        'signature'   => 'If you did not request a password reset, no further action is required.'
    ],

    'verify_email' => [
        'subject'     => 'Verify Email Address',
        'description' => 'Please click the button below to verify your email address.',
        'action'      => 'Verify Email Address',
        'expire'      => 'This verification link will expire at :expireDateTime.',
        'signature'   => 'If you did not request changing your email address, please contact the support.'
    ],

    'email_changed' => [
        'subject'     => 'Email changed',
        'description' => 'the email address of your account has been changed.',
        'new_email'   => 'New Email Address: :email',
        'signature'   => 'If you did not request changing your email address, please contact the support.'
    ],

    'password_changed' => [
        'subject'     => 'Password changed',
        'description' => 'the password of your account has been changed.',
        'signature'   => 'If you did not request changing your password, please contact the support.'
    ],

    'user_welcome' => [
        'subject'     => 'User account created',
        'description' => 'You are receiving this email because a new user account was created for your email address.',
        'action'      => 'Change password',
        'expire'      => 'You have time until :date, to change your password.'
    ],

    'room_expires' => [
        'subject'     => 'The room \':name\' will be deleted due to inactivity',
        'intro'       => 'to save server resources, unused rooms are automatically deleted.',
        'no_meeting'  => 'Your room \':name\' was created on :date but never started.',
        'inactivity'  => 'Your room \':name\' was created on :date, but the last usage was :days ago.',
        'open'        => 'Show room',
        'expire'      => 'If you don\'t take action, the room will be automatically deleted on :date.',
        'keep'        => 'If you would like to continue using the room, please start the room before the deadline.',
        'delete'      => 'If you no longer need the room, you can also delete it on your own.'
    ],
];
