<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages.
    |
    */

    'accepted'        => ':attribute muss akzeptiert werden.',
    'active_url'      => ':attribute ist keine gültige Internet-Adresse.',
    'after'           => ':attribute muss ein Datum nach dem :date sein.',
    'after_or_equal'  => ':attribute muss ein Datum nach dem :date oder gleich dem :date sein.',
    'alpha'           => ':attribute darf nur aus Buchstaben bestehen.',
    'alpha_dash'      => ':attribute darf nur aus Buchstaben, Zahlen, Binde- und Unterstrichen bestehen.',
    'alpha_num'       => ':attribute darf nur aus Buchstaben und Zahlen bestehen.',
    'array'           => ':attribute muss ein Array sein.',
    'before'          => ':attribute muss ein Datum vor dem :date sein.',
    'before_or_equal' => ':attribute muss ein Datum vor dem :date oder gleich dem :date sein.',
    'between'         => [
        'numeric' => ':attribute muss zwischen :min & :max liegen.',
        'file'    => ':attribute muss zwischen :min & :max Kilobytes groß sein.',
        'string'  => ':attribute muss zwischen :min & :max Zeichen lang sein.',
        'array'   => ':attribute muss zwischen :min & :max Elemente haben.',
    ],
    'boolean'          => ":attribute muss entweder 'true' oder 'false' sein.",
    'confirmed'        => ':attribute stimmt nicht mit der Bestätigung überein.',
    'current_password' => 'Das Passwort ist falsch.',
    'date'             => ':attribute muss ein gültiges Datum sein.',
    'date_equals'      => ':attribute muss ein Datum gleich :date sein.',
    'date_format'      => ':attribute entspricht nicht dem gültigen Format für :format.',
    'different'        => ':attribute und :other müssen sich unterscheiden.',
    'digits'           => ':attribute muss :digits Stellen haben.',
    'digits_between'   => ':attribute muss zwischen :min und :max Stellen haben.',
    'dimensions'       => ':attribute hat ungültige Bildabmessungen.',
    'distinct'         => ':attribute beinhaltet einen bereits vorhandenen Wert.',
    'email'            => ':attribute muss eine gültige E-Mail-Adresse sein.',
    'ends_with'        => ':attribute muss eine der folgenden Endungen aufweisen: :values',
    'exists'           => 'Der gewählte Wert für :attribute ist ungültig.',
    'file'             => ':attribute muss eine Datei sein.',
    'filled'           => ':attribute muss ausgefüllt sein.',
    'gt'               => [
        'numeric' => ':attribute muss größer als :value sein.',
        'file'    => ':attribute muss größer als :value Kilobytes sein.',
        'string'  => ':attribute muss länger als :value Zeichen sein.',
        'array'   => ':attribute muss mehr als :value Elemente haben.',
    ],
    'gte' => [
        'numeric' => ':attribute muss größer oder gleich :value sein.',
        'file'    => ':attribute muss größer oder gleich :value Kilobytes sein.',
        'string'  => ':attribute muss mindestens :value Zeichen lang sein.',
        'array'   => ':attribute muss mindestens :value Elemente haben.',
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
        'numeric' => ':attribute muss kleiner als :value sein.',
        'file'    => ':attribute muss kleiner als :value Kilobytes sein.',
        'string'  => ':attribute muss kürzer als :value Zeichen sein.',
        'array'   => ':attribute muss weniger als :value Elemente haben.',
    ],
    'lte' => [
        'numeric' => ':attribute muss kleiner oder gleich :value sein.',
        'file'    => ':attribute muss kleiner oder gleich :value Kilobytes sein.',
        'string'  => ':attribute darf maximal :value Zeichen lang sein.',
        'array'   => ':attribute darf maximal :value Elemente haben.',
    ],
    'max' => [
        'numeric' => ':attribute darf maximal :max sein.',
        'file'    => ':attribute darf maximal :max Kilobytes groß sein.',
        'string'  => ':attribute darf maximal :max Zeichen haben.',
        'array'   => ':attribute darf maximal :max Elemente haben.',
    ],
    'mimes'     => ':attribute muss den Dateityp :values haben.',
    'mimetypes' => ':attribute muss den Dateityp :values haben.',
    'min'       => [
        'numeric' => ':attribute muss mindestens :min sein.',
        'file'    => ':attribute muss mindestens :min Kilobytes groß sein.',
        'string'  => ':attribute muss mindestens :min Zeichen lang sein.',
        'array'   => ':attribute muss mindestens :min Elemente haben.',
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
        'numeric' => ':attribute muss gleich :size sein.',
        'file'    => ':attribute muss :size Kilobyte groß sein.',
        'string'  => ':attribute muss :size Zeichen lang sein.',
        'array'   => ':attribute muss genau :size Elemente haben.',
    ],
    'starts_with' => ':attribute muss mit einem der folgenden Anfänge aufweisen: :values',
    'string'      => ':attribute muss ein String sein.',
    'timezone'    => ':attribute muss eine gültige Zeitzone sein.',
    'unique'      => ':attribute ist bereits vergeben.',
    'uploaded'    => ':attribute konnte nicht hochgeladen werden.',
    'url'         => ':attribute muss eine URL sein.',
    'uuid'        => ':attribute muss ein UUID sein.',

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
            'in' => 'Die gewählte Sprache wird vom Server nicht unterstützt.'
        ],
        'user' => [
            'exists' => 'Der ausgewählte Benutzer konnte nicht gefunden werden.'
        ],
        'room' => [
            'already_member' => 'Der Benutzer ist bereits Mitglied des Raums.'
        ],
        'password'              => 'Das Passwort muss mindestens ein Zeichen aus jeder der folgenden vier Kategorien enthalten: Großbuchstabe (A - Z), Kleinbuchstaben (a - z), Zahl (0 - 9), nicht alphanumerisches Zeichen (zum Beispiel: !, $, #, oder %).',
        'replacement_room_type' => [
            'required' => 'Ersatzraumart benötigt! Dieser Raumart sind noch Räume zugeordnet.',
            'exists'   => 'Ersatzraumart ungültig! Es wird eine Ersatzraumart benötigt, da dieser Raumart noch Räume zugeordnet sind.',
            'not_in'   => 'Ersatzraumart ungültig! Es wird eine Ersatzraumart benötigt, da dieser Raumart noch Räume zugeordnet sind.',
        ],
        'banner' => [
            'array'    => 'Die Einstellungen für den Banner für Mitteilungen fehlen!',
            'required' => 'Die Einstellungen für den Banner für Mitteilungen fehlen!'
        ],
        'banner.icon' => [
            'regex' => 'Die Icon CSS-Klasse muss folgendem Format entsprechen: `fas fa-camera`. Wobei `fas` je nach Style auch anders sein kann (z. B. `fab`).'
        ],
        'color'     => ':attribute muss eine Farbe im Hexadezimalformat sein (z. B. #fff oder #ffffff)!',
        'servers.*' => [
            'exists'   => 'Der Server mit der ID :input konnte nicht gefunden werden.',
            'distinct' => 'Der Server mit der ID :input wurde mehrfach ausgewählt.'
        ],
        'roles.*' => [
            'exists'   => 'Eine der ausgewählten Rollen existiert nicht.',
            'distinct' => 'Mindestens eine Rolle wurde mehrfach ausgewählt.'
        ],
        'invalid_room_type' => 'Sie haben nicht die notwendigen Rechte, um einen Raum mit der übergebenen Raumart zu besitzen.'
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [
        'name'                               => 'Name',
        'user'                               => 'Benutzer',
        'username'                           => 'Benutzerkennung',
        'email'                              => 'E-Mail Adresse',
        'first_name'                         => 'Vorname',
        'last_name'                          => 'Nachname',
        'password'                           => 'Passwort',
        'password_confirmation'              => 'Passwort Bestätigung',
        'city'                               => 'Stadt',
        'country'                            => 'Land',
        'address'                            => 'Adresse',
        'phone'                              => 'Telefonnummer',
        'mobile'                             => 'Handynummer',
        'age'                                => 'Alter',
        'sex'                                => 'Geschlecht',
        'gender'                             => 'Geschlecht',
        'day'                                => 'Tag',
        'month'                              => 'Monat',
        'year'                               => 'Jahr',
        'hour'                               => 'Stunde',
        'minute'                             => 'Minute',
        'second'                             => 'Sekunde',
        'title'                              => 'Titel',
        'content'                            => 'Inhalt',
        'description'                        => 'Beschreibung',
        'excerpt'                            => 'Auszug',
        'date'                               => 'Datum',
        'time'                               => 'Uhrzeit',
        'available'                          => 'verfügbar',
        'size'                               => 'Größe',
        'welcome'                            => 'Begrüßungsnachricht',
        'room_type'                          => 'Raumart',
        'default_role'                       => 'Standardrolle',
        'duration'                           => 'Max. Dauer',
        'access_code'                        => 'Zugangscode',
        'allow_guests'                       => 'Gäste zulassen',
        'allow_membership'                   => 'Neue Mitglieder zulassen',
        'max_participants'                   => 'Max. Teilnehmeranzahl',
        'lobby'                              => 'Warteraum',
        'everyone_can_start'                 => 'Jeder darf das Meeting starten',
        'mute_on_start'                      => 'Mikrofon bei Beitritt stummschalten',
        'lock_settings_lock_on_join'         => 'Einschränkungen aktivieren',
        'lock_settings_disable_cam'          => 'Webcam deaktivieren',
        'webcams_only_for_moderator'         => 'Webcam nur für Moderatoren sichtbar',
        'lock_settings_disable_mic'          => 'Mikrofon deaktivieren',
        'lock_settings_disable_note'         => 'Bearbeiten der Notizen deaktivieren',
        'lock_settings_disable_private_chat' => 'Private Chats deaktivieren',
        'lock_settings_disable_public_chat'  => 'Öffentlichen Chat deaktivieren',
        'lock_settings_hide_user_list'       => 'Teilnehmerliste verbergen',
        'role'                               => 'Rolle',
        'file'                               => 'Datei',
        'permissions'                        => 'Rechte',
        'updated_at'                         => 'Aktualisiert am',
        'room_limit'                         => 'Max. Anzahl an Räumen',
        'roles'                              => 'Rollen',
        'bbb_skip_check_audio'               => 'Echo-Test deaktivieren',
        'firstname'                          => 'Vorname',
        'lastname'                           => 'Nachname',
        'user_locale'                        => 'Sprache',
        'banner.enabled'                     => 'Anzeigen',
        'banner.message'                     => 'Mitteilung',
        'banner.color'                       => 'Textfarbe des Banners',
        'banner.background'                  => 'Hintergrundfarbe des Banners',
        'banner.title'                       => 'Überschrift',
        'banner.link'                        => 'Anzuzeigender Link nach der Mitteilung',
        'banner.icon'                        => 'Icon',
        'banner.link_text'                   => 'Linktext',
        'banner.link_target'                 => 'Linkziel',
        'banner.link_style'                  => 'Linkart',
        'servers'                            => 'Server',
        'strength'                           => 'Serverstärke',
        'base_url'                           => 'API Endpunkt',
        'salt'                               => 'API Geheimnis',
        'server_pool'                        => 'Serverpool',
        'icon_text'                          => 'Icon Text',
        'color'                              => 'Farbe',
        'allow_listing'                      => 'Raumsuche erlaubt',
        'listed'                             => 'In Raumsuche einschließen',
        'password_self_reset_enabled'        => 'Registrierten Nutzern ermöglichen das Passwort zurückzusetzen',
        'timezone'                           => 'Zeitzone',
        'default_timezone'                   => 'Standardzeitzone',
        'default_presentation'               => 'Standard Präsentation',
        'help_url'                           => 'Hilfeseite',
        'legal_notice_url'                   => 'Impressum',
        'privacy_policy_url'                 => 'Datenschutzerklärung',
        'restrict'                           => 'Verwendung einschränken',
        'room_token_expiration'              => 'Ablaufzeit für personalisierte Raumlinks'
    ],

    'validname'       => ':attribute enthält die folgenden nicht erlaubten Zeichen: :chars',
    'validname_error' => ':attribute enthält nicht erlaubte Zeichen'
];
