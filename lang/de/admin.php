<?php

return [
    'home_button' => 'Zurück zur Übersicht',
    'overview' => 'Übersicht',
    'overview_description' => 'Hier können die Einstellungen der Anwendung verwaltet werden. Bitte wählen Sie eine der Kacheln aus, um die jeweiligen Einstellungen anzupassen.',
    'roles' => [
        'default' => 'Standard',
        'delete' => [
            'confirm' => 'Wollen Sie die Rolle :name wirklich löschen?',
            'item' => 'Rolle :id löschen',
            'title' => 'Rolle löschen?',
        ],
        'edit' => 'Rolle :name bearbeiten',
        'has_included_permission' => 'Das Recht ":name" wurde entweder explizit ausgewählt oder ist in einem anderen ausgewählten Recht inkludiert.',
        'has_not_included_permission' => 'Das Recht ":name" wurde weder explizit ausgewählt noch ist es in einem anderen ausgewählten Recht inkludiert.',
        'new' => 'Neue Rolle erstellen',
        'no_data' => 'Es sind keine Rollen vorhanden!',
        'no_data_filtered' => 'Für die Suchanfrage wurden keine Rollen gefunden!',
        'no_options' => 'Keine Berechtigungen vorhanden!',
        'permission_explicit' => 'Explizit',
        'permission_included' => 'Inkludiert',
        'permission_included_help' => 'Rechte die ausgewählt wurden und Rechte, die in den ausgewählten Rechten inkludiert sind.',
        'permission_name' => 'Name des Rechts',
        'permissions' => [
            'admin' => [
                'title' => 'Administration',
                'view' => 'Zugang zum Administrationsbereich',
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
                'title' => 'Anwendung',
                'update' => 'Einstellungen bearbeiten',
                'view_any' => 'Alle Einstellungen anzeigen',
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
        'permissions_title' => 'Rechte',
        'room_limit' => [
            'custom' => 'Benutzerdefinierter Wert',
            'default' => 'Systemstandard (:value)',
            'help_modal' => [
                'examples' => 'Beispiele',
                'info' => 'Die maximale Anzahl an eigenen Räumen ergibt sich aus dem Maximum der Begrenzungen der Rollen, welchen ein Benutzer angehört.',
                'note' => 'X: Benutzer ist nicht Mitglied dieser Rolle',
                'role_a' => 'Rolle A',
                'role_b' => 'Rolle B',
                'system_default' => 'Systemstandard',
            ],
        ],
        'select_roles' => 'Bitte wählen Sie mindestens eine Rolle aus',
        'tile_description' => 'Die Rollen vergeben Berechtigungen, gliedern die Benutzer und legen das Maximum an Räumen pro Benutzer fest.',
        'view' => 'Detaillierte Informationen für die Rolle :name',
    ],
    'room_types' => [
        'bbb_api' => [
            'create_parameters' => 'Zusätzliche Create-API-Parameter',
            'create_parameters_description' => 'Angabe als Attribut-Wert-Paar (eins pro Zeile, ohne Leerzeichen), z.B. webcamsOnlyForModerator=true',
            'title' => 'BigBlueButton API',
        ],
        'color' => 'Farbe',
        'custom_color' => 'Eigene Farbe',
        'default_room_settings' => [
            'default' => 'Standard',
            'enforced' => 'Erzwungen',
            'title' => 'Standard-Raumeinstellungen',
        ],
        'delete' => [
            'confirm' => 'Wollen Sie die Raumart :name wirklich löschen?',
            'item' => 'Raumart :id löschen',
            'no_replacement' => '-- Kein Ersatz --',
            'replacement' => 'Ersatzraumart',
            'replacement_info' => 'Wenn der Raumart noch Räume zugeordnet sind, muss ein Ersatz angegeben werden.',
            'title' => 'Raumart löschen?',
        ],
        'edit' => 'Raumart :name bearbeiten',
        'max_duration' => 'Maximale Dauer',
        'max_participants' => 'Maximale Teilnehmeranzahl',
        'missing_description' => 'Keine Beschreibungen vorhanden!',
        'new' => 'Neue Raumart erstellen',
        'no_data' => 'Es sind keine Raumarten vorhanden!',
        'no_data_filtered' => 'Für die Suchanfrage wurden keine Raumarten gefunden!',
        'preview' => 'Vorschau',
        'restrict' => 'Verwendung einschränken',
        'restrict_description' => 'Die Verwendung dieser Raumart und der dazugehörigen Server wird nur für die nachfolgend angegebenen Rollen gestattet.',
        'select_roles' => 'Rollen auswählen',
        'select_server_pool' => 'Serverpool auswählen',
        'server_pool_description' => 'Server dieses Serverpools werden für die Lastverteilung verwendet',
        'tile_description' => 'Die Raumarten sortieren die Räume, geben diesen Icons zur schnelleren Wiedererkennung und bestimmen auf welchem Serverpool ein Meeting stattfindet.',
        'view' => 'Detaillierte Informationen für die Raumart :name',
    ],
    'server_pools' => [
        'delete' => [
            'confirm' => 'Wollen Sie den Serverpool :name wirklich entfernen?',
            'failed' => 'Serverpool kann nicht gelöscht werden, weil die folgenden Raumarten diesen noch verwenden:',
            'item' => 'Serverpool :name löschen',
            'title' => 'Serverpool löschen?',
        ],
        'edit' => 'Serverpool :name bearbeiten',
        'new' => 'Neuen Serverpool hinzufügen',
        'no_data' => 'Es sind keine Serverpools vorhanden!',
        'no_data_filtered' => 'Für die Suchanfrage wurden keine Serverpools gefunden!',
        'remove_server' => 'Server entfernen',
        'select_servers' => 'Server auswählen',
        'server_count' => 'Anzahl Server',
        'tile_description' => 'Für die Lastverteilung werden mehrere Server gebündelt und über die Raumart jedem Raum zugewiesen.',
        'view' => 'Detaillierte Informationen über Serverpool :name',
    ],
    'servers' => [
        'base_url' => 'API Endpunkt',
        'connection' => 'Verbindung',
        'current_usage' => 'Aktuelle Auslastung',
        'delete' => [
            'confirm' => 'Wollen Sie den Server :name wirklich entfernen?',
            'item' => 'Server :name löschen',
            'title' => 'Server löschen?',
        ],
        'disabled' => 'Deaktiviert',
        'disabled_description' => 'Bereits laufende Meetings werden durch eine Deaktivierung nicht beendet, neue können jedoch nicht erstellt werden',
        'draining' => 'Auslaufend',
        'edit' => 'Server :name bearbeiten',
        'enabled' => 'Aktiviert',
        'flash' => [
            'panic' => [
                'description' => 'Es wurden :total Meetings gefunden und :success erfolgreich beendet.',
                'title' => 'Der Server wurde deaktiviert.',
            ],
        ],
        'hide_secret' => 'Klartext verbergen',
        'meeting_count' => 'Meetings',
        'meeting_description' => 'Alle Meetings auf dem BigBlueButton-Server',
        'new' => 'Neuen Server hinzufügen',
        'no_data' => 'Es sind keine Server vorhanden!',
        'no_data_filtered' => 'Für die Suchanfrage wurden keine Server gefunden!',
        'offline' => 'Offline',
        'offline_reason' => [
            'connection' => 'Der Verbindungsaufbau zum Server ist fehlgeschlagen.',
            'secret' => 'Es wurde eine Verbindung zum Server hergestellt, aber das API-Geheimnis ist ungültig.',
        ],
        'online' => 'Online',
        'own_meeting_count' => 'Eigene Meetings',
        'own_meeting_description' => 'Meetings, die von diesem System verwaltet werden',
        'panic' => 'Deaktivieren & Aufräumen',
        'panic_description' => 'Es werden nur Meetings beendet, die über dieses System erstellt wurden!',
        'panic_server' => 'Server deaktiveren und alle Meetings beenden',
        'participant_count' => 'Teilnehmer',
        'reload' => 'Auslastung neu bestimmen',
        'secret' => 'API Geheimnis',
        'show_secret' => 'Klartext anzeigen',
        'status' => 'Status',
        'strength' => 'Serverstärke',
        'strength_description' => 'Faktor für Lastverteilung; je höher desto mehr Teilnehmer und Meetings kann der Server verarbeiten',
        'test_connection' => 'Verbindung testen',
        'tile_description' => 'Die Server stellen die BBB Infrastruktur für die Meetings bereit.',
        'unhealthy' => 'Fehlerhaft',
        'unknown' => 'Unbekannt',
        'usage_info' => 'Die Auslastung (Meetings, Teilnehmer, Videos) beinhalten auch Meetings die von anderen Systemen verwaltet werden.',
        'version' => 'Version',
        'video_count' => 'Videos',
        'view' => 'Detaillierte Informationen über Server :name',
    ],
    'settings' => [
        'application' => 'Anwendung',
        'attendance' => [
            'retention_period_title' => 'Speicherdauer der Anwesenheitsprotokollierung in Tagen',
        ],
        'attendance_and_statistics_title' => 'Aufzeichnung und Statistik',
        'banner' => [
            'background' => 'Hintergrundfarbe des Banners',
            'banner_title' => 'Überschrift',
            'color' => 'Textfarbe des Banners',
            'enabled' => 'Anzeigen',
            'icon' => 'Icon',
            'icon_description' => 'Die CSS-Klasse des Fontawesome-Icons (z. B. `fa-solid fa-door-open`). Das Icon wird nur angezeigt, wenn ein Titel angegeben wurde.',
            'link' => 'Anzuzeigender Link nach der Mitteilung',
            'link_style' => 'Linkart',
            'link_target' => 'Linkziel',
            'link_text' => 'Linktext',
            'message' => 'Mitteilung',
            'preview' => 'Vorschau',
            'select_link_style' => 'Linkart auswählen',
            'select_link_target' => 'Linkziel auswählen',
            'title' => 'Banner für Mitteilungen',
        ],
        'bbb' => [
            'logo' => [
                'alt' => 'Logo Vorschau',
                'hint' => 'https://domain.tld/path/logo.svg',
                'select_file' => 'Logo-Datei auswählen',
                'title' => 'Logo',
                'upload_title' => 'Logo hochladen (max. 500 KB)',
                'url_title' => 'URL zu Logo-Datei',
            ],
            'style' => [
                'title' => 'CSS Style Datei',
            ],
            'title' => 'BigBlueButton Anpassungen',
        ],
        'default_presentation' => 'Standard Präsentation',
        'default_timezone' => 'Standardzeitzone',
        'favicon' => [
            'alt' => 'Favicon Vorschau',
            'hint' => 'https://domain.tld/path/favicon.ico',
            'select_file' => 'Favicon-Datei auswählen',
            'title' => 'Favicon',
            'upload_title' => 'Favicon hochladen (max. 500 KB, Format: .ico)',
            'url_title' => 'URL zu Favicon-Datei',
        ],
        'help_url' => [
            'description' => 'Wenn nicht gesetzt, wird kein Hilfe-Button angezeigt.',
            'title' => 'URL zur Hilfeseite',
        ],
        'legal_notice_url' => [
            'description' => 'Wenn nicht gesetzt, wird kein Link zum Impressum in der Fußzeile angezeigt.',
            'title' => 'URL zum Impressum',
        ],
        'logo' => [
            'alt' => 'Logo Vorschau',
            'hint' => 'https://domain.tld/path/logo.svg',
            'select_file' => 'Logo-Datei auswählen',
            'title' => 'Logo',
            'upload_title' => 'Logo hochladen (max. 500 KB)',
            'url_title' => 'URL zu Logo-Datei',
        ],
        'name' => [
            'description' => 'Ändert den Seitentitel',
            'title' => 'Name der Anwendung',
        ],
        'never' => 'Nie',
        'one_day' => '1 Tag (24 Stunden)',
        'one_month' => '1 Monat (30 Tage)',
        'one_week' => '1 Woche (7 Tage)',
        'one_year' => '1 Jahr (365 Tage)',
        'pagination_page_size' => [
            'description' => 'Anzahl der gleichzeitig angezeigten Datensätze in Tabellen',
            'title' => 'Größe der Paginierung',
        ],
        'password_change_allowed' => 'Lokale Benutzer können Passwort ändern',
        'privacy_policy_url' => [
            'description' => 'Wenn nicht gesetzt, wird kein Link zur Datenschutzerklärung in der Fußzeile angezeigt.',
            'title' => 'URL zur Datenschutzerklärung',
        ],
        'recording' => [
            'retention_period_title' => 'Speicherdauer der Aufzeichnungen in Tagen',
        ],
        'room_auto_delete' => [
            'deadline_period' => [
                'description' => 'Zeitraum zwischen Zustellung der Informations-E-Mail und der Löschung',
                'title' => 'Löschfrist',
            ],
            'enabled' => [
                'title' => 'Ungenutzte Räume automatisch löschen',
            ],
            'inactive_period' => [
                'description' => 'Räume deren letztes Meeting länger als der Zeitraum zurückliegt',
                'title' => 'Zeitraum bis inaktive Räume gelöscht werden',
            ],
            'never_used_period' => [
                'description' => 'Räume die vor dem Zeitraum erstellt, aber bisher noch nicht verwendet wurden',
                'title' => 'Zeitraum bis nie genutzte Räume gelöscht werden',
            ],
        ],
        'room_limit' => [
            'description' => 'Begrenzt die Anzahl der Räume, die ein Benutzer haben kann. Diese Einstellung wird von den gruppenspezifischen Grenzen überschrieben.',
            'title' => 'Anzahl der Räume pro Benutzer',
        ],
        'room_pagination_page_size' => [
            'description' => 'Anzahl der gleichzeitig angezeigten Räume auf der Startseite',
            'title' => 'Größe der Paginierung für die Räume',
        ],
        'room_token_expiration' => [
            'description' => 'Zeitraum ab der letzten Nutzung, wonach die personalisierten Raumlinks automatisch gelöscht werden.',
            'title' => 'Ablaufzeit für personalisierte Raumlinks',
        ],
        'six_month' => '6 Monate (180 Tage)',
        'statistics' => [
            'meetings' => [
                'enabled_title' => 'Auslastung der Meetings aufzeichnen',
                'retention_period_title' => 'Speicherdauer der Meetingauslastung in Tagen',
            ],
            'servers' => [
                'enabled_title' => 'Auslastung der Server aufzeichnen',
                'retention_period_title' => 'Speicherdauer der Serverauslastung in Tagen',
            ],
        ],
        'three_month' => '3 Monate (90 Tage)',
        'tile_description' => 'Regelt systemweitere Einstellungen wie Logo, Wartungs-Banner und Seitengrößen.',
        'title' => 'Einstellungen',
        'toast_lifetime' => [
            'custom' => 'Benutzerdefiniert',
            'description' => 'Zeit in Sekunden, für die eine Benachrichtigung angezeigt wird',
            'title' => 'Anzeigedauer von Pop-up-Nachrichten',
        ],
        'two_weeks' => '2 Wochen (14 Tage)',
        'two_years' => '2 Jahre (730 Tage)',
        'user_settings' => 'Benutzereinstellungen',
    ],
    'title' => 'Administration',
    'users' => [
        'authenticator' => [
            'ldap' => 'LDAP',
            'local' => 'Lokal',
            'shibboleth' => 'Shibboleth',
            'title' => 'Anmeldeart',
        ],
        'base_data' => 'Stammdaten',
        'bbb' => 'BigBlueButton',
        'delete' => [
            'confirm' => 'Wollen Sie den Benutzer :firstname :lastname wirklich löschen?',
            'item' => 'Benutzer :firstname :lastname löschen',
            'title' => 'Benutzer löschen?',
        ],
        'edit' => 'Benutzer :firstname :lastname bearbeiten',
        'email' => 'E-Mail',
        'generate_password' => 'Passwort generieren lassen',
        'generate_password_description' => 'Es wird ein generiertes Passwort gesetzt und eine E-Mail mit einem Passwort-Rücksetz-Link an den Benutzer gesendet. Wenn der Benutzer das Passwort in einem bestimmten Zeitraum nicht ändert, wird dieser automatisch wieder gelöscht.',
        'hide_password' => 'Password verbergen',
        'image' => [
            'crop' => 'Profilbild zuschneiden',
            'delete' => 'Bild löschen',
            'invalid_mime' => 'Das Dateiformat wird nicht unterstützt. Bitte wählen Sie eine jpg- oder png-Datei aus.',
            'save' => 'Übernehmen',
            'title' => 'Profilbild',
            'upload' => 'Neues Bild hochladen',
        ],
        'new' => 'Neuen Benutzer erstellen',
        'no_data' => 'Es sind keine Benutzer vorhanden!',
        'no_data_filtered' => 'Für die Suchanfrage wurden keine Benutzer gefunden!',
        'other_settings' => 'Weitere Einstellungen',
        'password_reset_success' => 'Passwort-Rücksetz-Mail wurde erfolgreich an :mail verschickt!',
        'remove_role' => 'Rolle entfernen',
        'reset_password' => [
            'confirm' => 'Wollen Sie das Passwort für :firstname :lastname wirklich zurücksetzen?',
            'item' => 'Passwort für den Benutzer :firstname :lastname zurücksetzen',
            'title' => 'Passwort zurücksetzen?',
        ],
        'role_filter' => 'Rolle zum Filtern auswählen',
        'roles_and_permissions' => 'Rollen and Berechtigungen',
        'show_password' => 'Password anzeigen',
        'skip_check_audio' => 'Echo-Test deaktivieren',
        'tile_description' => 'Die Benutzer können sich an dem System anmelden und je nach Rolle unterschiedliche Funktionen nutzen.',
        'timezone' => 'Zeitzone',
        'user_locale' => 'Sprache',
        'view' => 'Detaillierte Informationen für den Benutzer :firstname :lastname',
    ],
];
