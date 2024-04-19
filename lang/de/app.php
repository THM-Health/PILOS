<?php

return [
    'actions' => 'Aktionen',
    'back' => 'Zurück',
    'browse' => 'Durchsuchen',
    'button_styles' => [
        'danger' => 'Gefahr',
        'dark' => 'Dunkel',
        'info' => 'Info',
        'light' => 'Hell',
        'link' => 'Link',
        'primary' => 'Primär',
        'secondary' => 'Sekundär',
        'success' => 'Erfolg',
        'warning' => 'Warnung',
    ],
    'cancel' => 'Abbrechen',
    'cancel_editing' => 'Bearbeiten abbrechen',
    'close' => 'Schließen',
    'continue' => 'Weiter',
    'delete' => 'Löschen',
    'description' => 'Beschreibung',
    'disable' => 'Deaktivieren',
    'disabled' => 'Deaktiviert',
    'edit' => 'Bearbeiten',
    'email' => 'E-Mail',
    'enable' => 'Aktivieren',
    'enabled' => 'Aktiviert',
    'error' => 'Es ist ein Fehler aufgetreten',
    'errors' => [
        'attendance_agreement_missing' => 'Die Zustimmung zur Protokollierung der Anwesenheit ist erforderlich.',
        'join_failed' => 'Der Beitritt zum Raum ist fehlgeschlagen, da ein Verbindungsfehler aufgetreten ist.',
        'meeting_attendance_disabled' => 'Die Protokollierung der Anwesenheit ist nicht verfügbar.',
        'meeting_attendance_not_ended' => 'Die Protokollierung der Anwesenheit ist für diesen Raum noch nicht abgeschlossen.',
        'meeting_statistics_disabled' => 'Die Auslastungsdaten sind nicht verfügbar.',
        'membership_disabled' => 'Mitgliedschaft fehlgeschlagen! Eine Mitgliedschaft ist in diesem Raum aktuell nicht möglich.',
        'no_room_access' => 'Sie haben nicht die notwendigen Rechte, den Raum zu bearbeiten.',
        'no_server_available' => 'Zur Zeit sind keine Server verfügbar.',
        'not_member_of_room' => 'Die Person ist nicht (mehr) Mitglied dieses Raums.',
        'not_running' => 'Der Beitritt zum Raum ist fehlgeschlagen, da er derzeit geschlossen ist.',
        'record_agreement_missing' => 'Die Zustimmung zur Aufzeichnung ist erforderlich.',
        'role_delete_linked_users' => 'Die Rolle ist mit Benutzern verknüpft und kann deshalb nicht gelöscht werden!',
        'role_update_permission_lost' => 'Die Änderungen an der Rolle würden für Sie zum Verlust der Rechte zum Bearbeiten oder Anzeigen von Rollen führen!',
        'room_already_running' => 'Der Raum konnte nicht gestartet werden, weil er bereits läuft.',
        'room_limit_exceeded' => 'Raumerstellung fehlgeschlagen! Sie haben die max. Anzahl an Räumen erreicht.',
        'room_start' => 'Starten fehlgeschlagen! Der Raum konnte nicht gestartet werden.',
        'room_type_invalid' => 'Die Art des Raumes ist für bestimmte Benutzergruppen eingeschränkt. Wenn Sie der Beistzer des Raumes sind, ändern Sie bitte die Raumart, damit der Raum gestartet werden kann.',
        'server_delete_failed' => 'Der Server konnte nicht gelöscht werden. Um den Server zu löschen, muss dieser deaktivert werden und es dürfen keine Meetings laufen.',
        'server_pool_delete_failed' => 'Der Serverpool konnte nicht gelöscht werden. Um den Serverpool zu löschen, darf dieser von keiner Raumart verwendet werden.',
        'stale_error' => 'Änderungskonflikt',
        'stale_model' => 'Der :model-Datensatz wurde in der Zwischenzeit geändert!',
        'token_not_found' => 'Der personalisierte Raumlink konnte nicht gefunden werden.',
    ],
    'firstname' => 'Vorname',
    'flash' => [
        'client_error' => 'Es ist ein unbekannter Fehler in der Anwendung aufgetreten!',
        'guests_only' => 'Die Anfrage ist nur für nicht angemeldete Benutzer gestattet!',
        'popup_blocked' => 'Ihr Browser hat das Öffnen eines neuen Fensters blockiert. Bitte erlauben Sie das Öffnen von Popups für diese Seite und versuchen Sie es erneut.',
        'server_error' => [
            'empty_message' => 'Es ist ein Fehler auf dem Server aufgetreten!',
            'error_code' => 'Fehlercode: :statusCode',
            'message' => ':message',
        ],
        'too_large' => 'Die übertragenen Daten waren zu groß!',
        'too_many_requests' => 'Zu viele Anfragen. Bitte versuchen Sie es später noch einmal.',
        'unauthenticated' => 'Sie müssen angemeldet sein, um die Anfrage durchführen zu können!',
        'unauthorized' => 'Sie haben für die aufgerufene Route nicht die notwendigen Rechte!',
    ],
    'footer' => [
        'legal_notice' => 'Impressum',
        'privacy_policy' => 'Datenschutzerklärung',
    ],
    'help' => 'Benötigen Sie Hilfe?',
    'home' => 'Startseite',
    'id' => 'ID',
    'lastname' => 'Nachname',
    'link_targets' => [
        'blank' => 'In einem neuen Tab öffnen',
        'self' => 'Im aktuellen Tab öffnen',
    ],
    'model' => [
        'roles' => 'Rollen',
        'room_types' => 'Raumarten',
        'server_pools' => 'Serverpool',
        'servers' => 'Server',
        'users' => 'Benutzer',
    ],
    'model_name' => 'Name',
    'next' => 'Weiter',
    'next_page' => 'Nächste Seite',
    'no' => 'Nein',
    'not_found' => '404 | Die aufgerufene Adresse wurde nicht gefunden',
    'overwrite' => 'Überschreiben',
    'permissions' => [
        'application_settings' => [
            'title' => 'Anwendung',
            'update' => 'Einstellungen bearbeiten',
            'view_any' => 'Alle Einstellungen anzeigen',
        ],
        'meetings' => [
            'title' => 'Meetings',
            'view_any' => 'Alle Meetings anzeigen',
        ],
        'roles' => [
            'create' => 'Rollen erstellen',
            'delete' => 'Rollen löschen',
            'title' => 'Rollen',
            'update' => 'Rollen bearbeiten',
            'view' => 'Rollen anzeigen',
            'view_any' => 'Alle Rollen anzeigen',
        ],
        'room_types' => [
            'create' => 'Raumarten erstellen',
            'delete' => 'Raumarten löschen',
            'title' => 'Raumarten',
            'update' => 'Raumarten bearbeiten',
            'view' => 'Raumarten anzeigen',
        ],
        'rooms' => [
            'create' => 'Räume erstellen',
            'manage' => 'Alle Räume verwalten',
            'title' => 'Räume',
            'view_all' => 'Alle Räume anzeigen',
        ],
        'server_pools' => [
            'create' => 'Serverpools erstellen',
            'delete' => 'Serverpools löschen',
            'title' => 'Serverpools',
            'update' => 'Serverpools bearbeiten',
            'view' => 'Serverpools anzeigen',
            'view_any' => 'Alle Serverpools anzeigen',
        ],
        'servers' => [
            'create' => 'Server erstellen',
            'delete' => 'Server löschen',
            'title' => 'Server',
            'update' => 'Server bearbeiten',
            'view' => 'Server anzeigen',
            'view_any' => 'Alle Server anzeigen',
        ],
        'settings' => [
            'manage' => 'Einstellungen verwalten',
            'title' => 'Einstellungen',
        ],
        'system' => [
            'monitor' => 'Überwachung',
            'title' => 'System',
        ],
        'users' => [
            'create' => 'Benutzer erstellen',
            'delete' => 'Benutzer löschen',
            'title' => 'Benutzer',
            'update' => 'Benutzer bearbeiten',
            'update_own_attributes' => 'Eigenen Vornamen, Nachnamen und E-Mail bearbeiten',
            'view' => 'Benutzer anzeigen',
            'view_any' => 'Alle Benutzer anzeigen',
        ],
    ],
    'previous_page' => 'Vorherige Seite',
    'profile' => 'Profil',
    'reload' => 'Neuladen',
    'reset' => 'Zurücksetzen',
    'roles' => 'Rollen',
    'room_limit' => 'Maximale Anzahl an Räumen',
    'room_types' => 'Raumarten',
    'rooms' => 'Räume',
    'save' => 'Speichern',
    'search' => 'Suche',
    'security' => 'Sicherheit',
    'select_locale' => 'Wählen Sie eine Sprache aus',
    'server' => 'Server',
    'server_pool' => 'Serverpool',
    'server_pools' => 'Serverpools',
    'servers' => 'Server',
    'time_formats' => [
        'day' => 'Tag',
        'days' => 'Tage',
        'hour' => 'Stunde',
        'hours' => 'Stunden',
        'minute' => 'Minute',
        'minutes' => 'Minuten',
        'second' => 'Sekunde',
        'seconds' => 'Sekunden',
    ],
    'undo_delete' => 'Löschen rückgänig machen',
    'unlimited' => 'Unbegrenzt',
    'user' => 'Benutzer',
    'user_name' => 'Name',
    'users' => 'Benutzer',
    'validation' => [
        'invalid_type' => 'Der Dateityp ist nicht erlaubt.',
        'too_large' => 'Die ausgewählte Datei ist zu groß.',
    ],
    'verify_email' => [
        'fail' => 'Ihre E-Mail konnte nicht verifiziert werden!',
        'invalid' => 'Der Verifizierungslink ist ungültig oder abgelaufen!',
        'success' => 'Ihre E-Mail wurde erfolgreich verifiziert!',
        'title' => 'E-Mail verifizieren',
    ],
    'version' => 'Version',
    'view' => 'Anzeigen',
    'wait' => 'Bitte warten...',
    'yes' => 'Ja',
];
