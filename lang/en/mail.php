<?php

return  [
  'action_url'    => 'If you’re having trouble clicking the ":actionText" button, copy and paste the URL below into your web browser:',
  'email_changed' => [
    'description' => 'The email address of your account has been changed.',
    'new_email'   => 'New Email Address: :email',
    'signature'   => 'If you did not request changing your email address, please contact the support.',
    'subject'     => 'Email changed',
  ],
  'greeting'         => 'Hello :name,',
  'password_changed' => [
    'description' => 'The password of your account has been changed.',
    'signature'   => 'If you did not request changing your password, please contact the support.',
    'subject'     => 'Password changed',
  ],
  'password_reset' => [
    'action'      => 'Reset Password',
    'description' => 'You are receiving this email because we received a password reset request for your account.',
    'expire'      => 'This password reset link will expire at :date.',
    'signature'   => 'If you did not request a password reset, no further action is required.',
    'subject'     => 'Reset Password Notification',
  ],
  'regards'      => 'Regards',
  'room_expires' => [
    'delete'     => 'If you no longer need the room, you can also delete it on your own.',
    'expire'     => 'If you don\'t take action, the room will be automatically deleted on :date.',
    'inactivity' => 'Your room ":name" was created on :date, but the last usage was :days ago.',
    'intro'      => 'to save server resources, unused rooms are automatically deleted.',
    'keep'       => 'If you would like to continue using the room, please start the room before the deadline.',
    'no_meeting' => 'Your room ":name" was created on :date but never started.',
    'open'       => 'Show room',
    'subject'    => 'The room ":name" will be deleted due to inactivity',
  ],
  'user_welcome' => [
    'action'      => 'Change password',
    'description' => 'You are receiving this email because a new user account was created for your email address.',
    'expire'      => 'You have time until :date, to change your password.',
    'subject'     => 'User account created',
  ],
  'verify_email' => [
    'action'      => 'Verify Email Address',
    'description' => 'Please click the button below to verify your email address.',
    'expire'      => 'This verification link will expire at :expireDateTime.',
    'signature'   => 'If you did not request changing your email address, please contact the support.',
    'subject'     => 'Verify Email Address',
  ],
];
