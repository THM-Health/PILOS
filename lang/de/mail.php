<?php

return [
    'greeting'   => 'Hallo :name,',
    'regards'    => 'Mit freundlichen Grüßen',
    'action_url' => 'Wenn Sie Probleme haben, den ":actionText" Button zu drücken, kopieren Sie die nachfolgende URL und fügen diese in Ihren Browser ein:',

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
    ],

    'room_expires' => [
        'subject'     => 'Der Raum ":name" wird wegen Inaktivität gelöscht',
        'intro'       => 'um Serverressourcen  zu sparen, werden nicht genutzte Räume automatisch gelöscht.',
        'no_meeting'  => 'Ihr Raum ":name" wurde am :date erstellt, jedoch noch nie gestartet.',
        'inactivity'  => 'Ihr Raum ":name" wurde am :date erstellt, die letzte Nutzung liegt jedoch schon :days Tage zurück.',
        'open'        => 'Raum anzeigen',
        'expire'      => 'Wenn Sie nichts weiter tun, wird der Raum am :date automatisch gelöscht.',
        'keep'        => 'Möchten Sie den Raum weiterhin nutzen, starten Sie den Raum bitte vor Ablauf der Frist.',
        'delete'      => 'Sollten Sie den Raum nicht mehr benötigen, können Sie diesen auch selbständig löschen.'
    ],
];
