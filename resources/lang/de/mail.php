<?php

return [
    'password_reset' => [
        'subject'     => 'Passwort-Rücksetz-Benachrichtigung',
        'description' => 'Sie erhalten diese E-Mail, weil eine Anfrage zum Zurücksetzen des Passworts für Ihr Benutzerkonto gestellt wurde.',
        'action'      => 'Passwort zurücksetzen',
        'expire'      => 'Der Rücksetz-Link wird am :date ablaufen.',
        'signature'   => 'Wenn Sie keine Anfrage zum Zurücksetzen des Passworts gestellt haben, ist keine weitere Aktion nötig.'
    ],

    'user_welcome' => [
        'subject'     => 'Benutzerkonto wurde erstellt',
        'description' => 'Sie erhalten diese E-Mail, weil ein neues Nutzerkonto für Ihre E-Mail-Adresse erstellt wurde.',
        'action'      => 'Passwort ändern',
        'expire'      => 'Sie haben bis zum :date Zeit, Ihr Passwort zu ändern.'
    ]
];
