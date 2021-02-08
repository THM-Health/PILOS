<?php

return [
    'greeting' => 'Hello :name,',
    'regards' => 'Regards',
    'action_url' => 'If you’re having trouble clicking the ":actionText" button, copy and paste the URL below into your web browser:',

    'password_reset' => [
        'subject'     => 'Reset Password Notification',
        'description' => 'You are receiving this email because we received a password reset request for your account.',
        'action'      => 'Reset Password',
        'expire'      => 'This password reset link will expire at :date.',
        'signature'   => 'If you did not request a password reset, no further action is required.'
    ],

    'user_welcome' => [
        'subject'     => 'User account created',
        'description' => 'You are receiving this email because a new user account was created for your email address.',
        'action'      => 'Change password',
        'expire'      => 'You have time until :date, to change your password.'
    ]
];
