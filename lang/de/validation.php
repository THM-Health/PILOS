<?php

return [
    'accepted'       => ':attribute muss akzeptiert werden.',
    'active_url'     => ':attribute ist keine gültige Internet-Adresse.',
    'after'          => ':attribute muss ein Datum nach dem :date sein.',
    'after_or_equal' => ':attribute muss ein Datum nach oder gleich dem :date sein.',
    'alpha'          => ':attribute darf nur aus Buchstaben bestehen.',
    'alpha_dash'     => ':attribute darf nur aus Buchstaben, Zahlen, Binde- und Unterstrichen bestehen.',
    'alpha_num'      => ':attribute darf nur aus Buchstaben und Zahlen bestehen.',
    'array'          => ':attribute muss ein Array sein.',
    'attributes'     => [
        'access_code'                        => 'Zugangscode',
        'address'                            => 'Adresse',
        'age'                                => 'Alter',
        'allow_guests'                       => 'Gäste zulassen',
        'allow_listing'                      => 'Raumsuche erlaubt',
        'allow_membership'                   => 'Neue Mitglieder zulassen',
        'available'                          => 'verfügbar',
        'banner_background'                  => 'Hintergrundfarbe des Banners',
        'banner_color'                       => 'Textfarbe des Banners',
        'banner_enabled'                     => 'Banner anzeigen',
        'banner_icon'                        => 'Icon',
        'banner_link'                        => 'Anzuzeigender Link nach der Mitteilung',
        'banner_link_style'                  => 'Linkart',
        'banner_link_target'                 => 'Linkziel',
        'banner_link_text'                   => 'Linktext',
        'banner_message'                     => 'Mitteilung',
        'banner_title'                       => 'Überschrift',
        'base_url'                           => 'API Endpunkt',
        'bbb_skip_check_audio'               => 'Echo-Test deaktivieren',
        'city'                               => 'Stadt',
        'color'                              => 'Farbe',
        'content'                            => 'Inhalt',
        'country'                            => 'Land',
        'current_password'                   => 'Aktuelles Passwort',
        'date'                               => 'Datum',
        'day'                                => 'Tag',
        'default_presentation'               => 'Standard Präsentation',
        'default_role'                       => 'Standardrolle',
        'default_timezone'                   => 'Standardzeitzone',
        'description'                        => 'Beschreibung',
        'duration'                           => 'Max. Dauer',
        'email'                              => 'E-Mail-Adresse',
        'everyone_can_start'                 => 'Jeder darf das Meeting starten',
        'excerpt'                            => 'Auszug',
        'file'                               => 'Datei',
        'first_name'                         => 'Vorname',
        'firstname'                          => 'Vorname',
        'gender'                             => 'Geschlecht',
        'help_url'                           => 'Hilfeseite',
        'hour'                               => 'Stunde',
        'icon_text'                          => 'Icon Text',
        'last_name'                          => 'Nachname',
        'lastname'                           => 'Nachname',
        'legal_notice_url'                   => 'Impressum',
        'listed'                             => 'In Raumsuche einschließen',
        'lobby'                              => 'Warteraum',
        'lock_settings_disable_cam'          => 'Webcam deaktivieren',
        'lock_settings_disable_mic'          => 'Mikrofon deaktivieren',
        'lock_settings_disable_note'         => 'Bearbeiten der Notizen deaktivieren',
        'lock_settings_disable_private_chat' => 'Private Chats deaktivieren',
        'lock_settings_disable_public_chat'  => 'Öffentlichen Chat deaktivieren',
        'lock_settings_hide_user_list'       => 'Teilnehmerliste verbergen',
        'lock_settings_lock_on_join'         => 'Einschränkungen aktivieren',
        'max_participants'                   => 'Max. Teilnehmeranzahl',
        'minute'                             => 'Minute',
        'mobile'                             => 'Handynummer',
        'month'                              => 'Monat',
        'mute_on_start'                      => 'Mikrofon bei Beitritt stummschalten',
        'name'                               => 'Name',
        'new_password'                       => 'Neues Passwort',
        'new_password_confirmation'          => 'Neues Passwort Bestätigung',
        'password'                           => 'Passwort',
        'password_change_allowed'            => 'Lokalen Benutzer ermöglichen das Passwort zu ändern',
        'password_confirmation'              => 'Passwort Bestätigung',
        'permissions'                        => 'Rechte',
        'phone'                              => 'Telefonnummer',
        'privacy_policy_url'                 => 'Datenschutzerklärung',
        'restrict'                           => 'Verwendung einschränken',
        'role'                               => 'Rolle',
        'roles'                              => 'Rollen',
        'room_limit'                         => 'Maximale Anzahl an Räumen',
        'room_token_expiration'              => 'Ablaufzeit für personalisierte Raumlinks',
        'room_type'                          => 'Raumart',
        'secret'                             => 'API Geheimnis',
        'second'                             => 'Sekunde',
        'server_pool'                        => 'Serverpool',
        'servers'                            => 'Server',
        'sex'                                => 'Geschlecht',
        'size'                               => 'Größe',
        'strength'                           => 'Serverstärke',
        'time'                               => 'Uhrzeit',
        'timezone'                           => 'Zeitzone',
        'title'                              => 'Titel',
        'updated_at'                         => 'Aktualisiert am',
        'user'                               => 'Benutzer',
        'user_emails'                        => 'E-Mail-Liste',
        'user_locale'                        => 'Sprache',
        'username'                           => 'Benutzerkennung',
        'webcams_only_for_moderator'         => 'Webcam nur für Moderatoren sichtbar',
        'welcome'                            => 'Begrüßungsnachricht',
        'year'                               => 'Jahr',
    ],
    'before'          => ':attribute muss ein Datum vor dem :date sein.',
    'before_or_equal' => ':attribute muss ein Datum vor oder gleich dem :date sein.',
    'between'         => [
        'array'   => ':attribute muss zwischen :min & :max Elemente haben.',
        'file'    => ':attribute muss zwischen :min & :max Kilobytes groß sein.',
        'numeric' => ':attribute muss zwischen :min & :max liegen.',
        'string'  => ':attribute muss zwischen :min & :max Zeichen lang sein.',
    ],
    'boolean'          => ':attribute muss entweder \'true\' oder \'false\' sein.',
    'confirmed'        => ':attribute stimmt nicht mit der Bestätigung überein.',
    'current_password' => 'Das Passwort ist falsch.',
    'custom'           => [
        'banner' => [
            'array' => 'Die Einstellungen für den Banner für Mitteilungen fehlen!',
            'icon'  => [
                'regex' => 'Die Icon CSS-Klasse muss folgendem Format entsprechen: `fa-solid fa-door-open`.',
            ],
            'required' => 'Die Einstellungen für den Banner für Mitteilungen fehlen!',
        ],
        'color'             => ':attribute muss eine Farbe im Hexadezimalformat sein (z. B. #fff oder #ffffff)!',
        'invalid_room_type' => 'Sie haben nicht die notwendigen Rechte, um einen Raum mit der übergebenen Raumart zu besitzen.',
        'locale'            => [
            'in' => 'Die gewählte Sprache wird vom Server nicht unterstützt.',
        ],
        'password'              => 'Das Passwort muss mindestens ein Zeichen aus jeder der folgenden vier Kategorien enthalten: Großbuchstabe (A - Z), Kleinbuchstaben (a - z), Zahl (0 - 9), nicht alphanumerisches Zeichen (zum Beispiel: !, $, #, oder %).',
        'replacement_room_type' => [
            'exists'   => 'Ersatzraumart ungültig! Es wird eine Ersatzraumart benötigt, da dieser Raumart noch Räume zugeordnet sind.',
            'not_in'   => 'Ersatzraumart ungültig! Es wird eine Ersatzraumart benötigt, da dieser Raumart noch Räume zugeordnet sind.',
            'required' => 'Ersatzraumart benötigt! Dieser Raumart sind noch Räume zugeordnet.',
        ],
        'roles' => [
            '*' => [
                'distinct' => 'Mindestens eine Rolle wurde mehrfach ausgewählt.',
                'exists'   => 'Eine der ausgewählten Rollen existiert nicht.',
            ],
        ],
        'room' => [
            'already_member'            => 'Der Benutzer ist bereits Mitglied des Raums.',
            'not_member'                => 'Der Benutzer ":firstname :lastname" ist nicht Mitglied des Raums.',
            'self_delete'               => 'Sie dürfen sich nicht selbst löschen.',
            'self_edit'                 => 'Sie dürfen sich nicht selbst bearbeiten.',
            'several_users_found_email' => 'Es wurden mehrere Benutzer mit dieser E-Mail gefunden',
            'user_not_found_email'      => 'Es wurde kein Benuter mit dieser E-Mail gefunden',
        ],
        'servers' => [
            '*' => [
                'distinct' => 'Der Server mit der ID :input wurde mehrfach ausgewählt.',
                'exists'   => 'Der Server mit der ID :input konnte nicht gefunden werden.',
            ],
        ],
        'user' => [
            'exists' => 'Der ausgewählte Benutzer konnte nicht gefunden werden.',
        ],
        'user_emails' => [
            '*' => [
                'email' => ':input ist keine gültige E-mail-Adresse.',
            ],
        ],
    ],
    'date'           => ':attribute muss ein gültiges Datum sein.',
    'date_equals'    => ':attribute muss ein Datum gleich :date sein.',
    'date_format'    => ':attribute entspricht nicht dem gültigen Format für :format.',
    'different'      => ':attribute und :other müssen sich unterscheiden.',
    'digits'         => ':attribute muss :digits Stellen haben.',
    'digits_between' => ':attribute muss zwischen :min und :max Stellen haben.',
    'dimensions'     => ':attribute hat ungültige Bildabmessungen.',
    'distinct'       => ':attribute beinhaltet einen bereits vorhandenen Wert.',
    'email'          => ':attribute muss eine gültige E-Mail-Adresse sein.',
    'ends_with'      => ':attribute muss eine der folgenden Endungen aufweisen: :values.',
    'exists'         => 'Der gewählte Wert für :attribute ist ungültig.',
    'file'           => ':attribute muss eine Datei sein.',
    'filled'         => ':attribute muss ausgefüllt sein.',
    'gt'             => [
        'array'   => ':attribute muss mehr als :value Elemente haben.',
        'file'    => ':attribute muss größer als :value Kilobytes sein.',
        'numeric' => ':attribute muss größer als :value sein.',
        'string'  => ':attribute muss länger als :value Zeichen sein.',
    ],
    'gte' => [
        'array'   => ':attribute muss mindestens :value Elemente haben.',
        'file'    => ':attribute muss größer oder gleich :value Kilobytes sein.',
        'numeric' => ':attribute muss größer oder gleich :value sein.',
        'string'  => ':attribute muss mindestens :value Zeichen lang sein.',
    ],
    'image'    => ':attribute muss ein Bild sein.',
    'in'       => 'Der gewählte Wert für :attribute ist ungültig.',
    'in_array' => 'Der gewählte Wert für :attribute kommt nicht in :other vor.',
    'integer'  => ':attribute muss eine ganze Zahl sein.',
    'ip'       => ':attribute muss eine gültige IP-Adresse sein.',
    'ipv4'     => ':attribute muss eine gültige IPv4-Adresse sein.',
    'ipv6'     => ':attribute muss eine gültige IPv6-Adresse sein.',
    'json'     => ':attribute muss ein gültiger JSON-String sein.',
    'lt'       => [
        'array'   => ':attribute muss weniger als :value Elemente haben.',
        'file'    => ':attribute muss kleiner als :value Kilobytes sein.',
        'numeric' => ':attribute muss kleiner als :value sein.',
        'string'  => ':attribute muss kürzer als :value Zeichen sein.',
    ],
    'lte' => [
        'array'   => ':attribute darf maximal :value Elemente haben.',
        'file'    => ':attribute muss kleiner oder gleich :value Kilobytes sein.',
        'numeric' => ':attribute muss kleiner oder gleich :value sein.',
        'string'  => ':attribute darf maximal :value Zeichen lang sein.',
    ],
    'max' => [
        'array'   => ':attribute darf maximal :max Elemente haben.',
        'file'    => ':attribute darf maximal :max Kilobytes groß sein.',
        'numeric' => ':attribute darf maximal :max sein.',
        'string'  => ':attribute darf maximal :max Zeichen haben.',
    ],
    'mimes'     => ':attribute muss den Dateityp :values haben.',
    'mimetypes' => ':attribute muss den Dateityp :values haben.',
    'min'       => [
        'array'   => ':attribute muss mindestens :min Elemente haben.',
        'file'    => ':attribute muss mindestens :min Kilobytes groß sein.',
        'numeric' => ':attribute muss mindestens :min sein.',
        'string'  => ':attribute muss mindestens :min Zeichen lang sein.',
    ],
    'multiple_of'          => ':attribute muss ein Vielfaches von :value sein.',
    'not_in'               => 'Der gewählte Wert für :attribute ist ungültig.',
    'not_regex'            => ':attribute hat ein ungültiges Format.',
    'numeric'              => ':attribute muss eine Zahl sein.',
    'password'             => 'Das Passwort ist falsch.',
    'present'              => ':attribute muss vorhanden sein.',
    'prohibited'           => ':attribute ist unzulässig.',
    'prohibited_if'        => ':attribute ist unzulässig, wenn :other :value ist.',
    'prohibited_unless'    => ':attribute ist unzulässig, wenn :other nicht :values ist.',
    'regex'                => ':attribute Format ist ungültig.',
    'required'             => ':attribute muss ausgefüllt werden.',
    'required_if'          => ':attribute muss ausgefüllt werden, wenn :other den Wert :value hat.',
    'required_unless'      => ':attribute muss ausgefüllt werden, wenn :other nicht den Wert :values hat.',
    'required_with'        => ':attribute muss ausgefüllt werden, wenn :values ausgefüllt wurde.',
    'required_with_all'    => ':attribute muss ausgefüllt werden, wenn :values ausgefüllt wurde.',
    'required_without'     => ':attribute muss ausgefüllt werden, wenn :values nicht ausgefüllt wurde.',
    'required_without_all' => ':attribute muss ausgefüllt werden, wenn keines der Felder :values ausgefüllt wurde.',
    'same'                 => ':attribute und :other müssen übereinstimmen.',
    'size'                 => [
        'array'   => ':attribute muss genau :size Elemente haben.',
        'file'    => ':attribute muss :size Kilobyte groß sein.',
        'numeric' => ':attribute muss gleich :size sein.',
        'string'  => ':attribute muss :size Zeichen lang sein.',
    ],
    'starts_with'     => ':attribute muss mit einem der folgenden Anfänge aufweisen: :values.',
    'string'          => ':attribute muss ein String sein.',
    'timezone'        => ':attribute muss eine gültige Zeitzone sein.',
    'unique'          => ':attribute ist bereits vergeben.',
    'uploaded'        => ':attribute konnte nicht hochgeladen werden.',
    'url'             => ':attribute muss eine URL sein.',
    'uuid'            => ':attribute muss ein UUID sein.',
    'validname'       => ':attribute enthält die folgenden nicht erlaubten Zeichen: :chars',
    'validname_error' => ':attribute enthält nicht erlaubte Zeichen',
];
