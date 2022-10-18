export default {
  title: 'Einstellungen',
  homeButton: 'Zurück zur Übersicht',
  overview: 'Übersicht',
  overviewDescription: 'Hier können die Einstellungen der Anwendung verwaltet werden. Bitte wählen Sie eine der Kacheln aus, um die jeweiligen Einstellungen anzupassen.',

  roles: {
    title: 'Rollen',
    tileDescription: 'Die Rollen vergeben Berechtigungen, gliedern die Benutzer und legen das max. an Räumen pro Nutzer fest.',

    new: 'Neue Rolle erstellen',
    view: 'Detaillierte Informationen für die Rolle {name}',
    edit: 'Rolle {name} bearbeiten',

    id: 'ID',
    name: 'Name',
    permissions: 'Rechte',
    permissionName: 'Name des Rechts',
    permissionExplicit: 'Explizit',
    permissionIncluded: 'Inkludiert',
    permissionIncludedHelp: 'Rechte die ausgewählt wurden und Rechte, die in den ausgewählten Rechten inkludiert sind.',
    hasIncludedPermission: 'Das Recht "{name}" wurde entweder explizit ausgewählt oder ist in einem anderen ausgewählten Recht inkludiert.',
    hasNotIncludedPermission: 'Das Recht "{name}" wurde weder explizit ausgewählt noch ist es in einem anderen ausgewählten Recht inkludiert.',
    roomLimit: {
      label: 'Max. Anzahl an Räumen',
      default: 'Systemstandard ({value})',
      unlimited: 'Unbegrenzt',
      custom: 'Benutzerdefinierter Wert',
      helpModal: {
        title: 'Max. Anzahl an Räumen',
        info: 'Die max. Anzahl an eigenen Räumen ergibt sich aus dem Maximum der Begrenzungen der Rollen, welchen ein Benutzer angehört.',
        examples: 'Beispiele',
        systemDefault: 'Systemstandard',
        roleA: 'Rolle A',
        roleB: 'Rolle B',
        maxAmount: 'Max. Anzahl',
        note: 'X: Nutzer ist nicht Mitglied dieser Rolle'
      }
    },
    select_roles: 'Bitte wählen Sie mindestens eine Rolle aus',
    default: 'Standard',
    nodata: 'Es sind keine Rollen vorhanden!',

    noOptions: 'Keine Berechtigungen vorhanden!',

    delete: {
      item: 'Rolle {id} löschen',
      confirm: 'Wollen Sie die Rolle {name} wirklich löschen?',
      title: 'Rolle löschen?'
    }
  },

  users: {
    title: 'Benutzer',
    tileDescription: 'Die Benutzer können sich an dem System anmelden und je nach Rolle unterschiedliche Funktionen nutzen.',

    new: 'Neuen Benutzer erstellen',
    view: 'Detaillierte Informationen für den Benutzer {firstname} {lastname}',
    edit: 'Benutzer {firstname} {lastname} bearbeiten',

    nodata: 'Es sind keine Benutzer vorhanden!',
    nodataFiltered: 'Für die Suchanfrage wurden keine Benutzer gefunden!',
    role_filter: 'Rolle zum Filtern auswählen',

    image: {
      title: 'Profilbild',
      upload: 'Neues Bild hochladen',
      crop: 'Profilbild zuschneiden',
      save: 'Übernehmen',
      cancel: 'Abbrechen',
      delete: 'Bild löschen',
      undo_delete: 'Löschen rückgänig machen',
      invalidMime: {
        message: 'Das Dateiformat wird nicht unterstützt. Bitte wählen Sie eine jpg- oder png-Datei aus.',
        title: 'Ungültiges Dateiformat'
      }
    },

    id: 'ID',
    firstname: 'Vorname',
    lastname: 'Nachname',
    password: 'Passwort',
    roles: 'Rollen',
    remove_role: 'Rolle entfernen',
    select_locale: 'Wählen Sie eine Sprache aus',
    current_password: 'Aktuelles Passwort',
    new_password: 'Neues Passwort',
    new_password_confirmation: 'Neues Passwort bestätigen',
    show_password: 'Passwort anzeigen',
    hide_password: 'Passwort verbergen',

    user_locale: 'Sprache',

    base_data: 'Stammdaten',

    generate_password: 'Passwort generieren lassen',
    generate_password_description: 'Es wird ein generiertes Passwort gesetzt und eine E-Mail mit einem Passwort-Rücksetz-Link an den Nutzer gesendet. Wenn der Nutzer das Passwort in einem bestimmten Zeitraum nicht ändert, wird dieser automatisch wieder gelöscht.',

    authenticator: {
      title: 'Anmeldeart',
      users: 'Registrierter Nutzer',
      ldap: 'LDAP'
    },

    delete: {
      item: 'Benutzer {firstname} {lastname} löschen',
      confirm: 'Wollen Sie den Benutzer {firstname} {lastname} wirklich löschen?',
      title: 'Benutzer löschen?'
    },

    resetPassword: {
      item: 'Passwort für den Benutzer {firstname} {lastname} zurücksetzen',
      confirm: 'Wollen Sie das Passwort für {firstname} {lastname} wirklich zurücksetzen?',
      title: 'Passwort zurücksetzen?'
    },

    tabs: {
      profile: 'Stammdaten',
      email: 'E-Mail',
      authentication: 'Sicherheit',
      other_settings: 'Weitere Einstellungen'
    },

    email: {
      title: 'E-Mail',
      current_password: 'Aktuelles Passwort',
      email: 'E-Mail',
      save: 'E-Mail Adresse ändern',
      validation_required: 'Es wurde eine Bestätigungsmail an {email} gesendet. Bestätigen Sie die Änderung, in dem Sie auf den Link in der E-Mail klicken.',
      throttle: {
        title: 'Zu viele Anfragen',
        message: 'Sie haben bereits vor kurzem eine Anfrage zur Änderung der E-Mail Adresse gestellt. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.'
      }
    },

    authentication: {

      change_password: {
        title: 'Passwort ändern',
        current_password: 'Aktuelles Passwort',
        new_password: 'Neues Passwort',
        new_password_confirmation: 'Neues Passwort bestätigen',
        save: 'Passwort ändern',
        success: {
          message: 'Das Passwort wurde erfolgreich geändert.',
          title: 'Passwort geändert'
        }
      },

      roles_and_perm: {
        title: 'Rollen and Berechtigungen',
        roles: 'Rollen'
      },

      sessions: {
        title: 'Aktive Sitzungen',
        unknown: 'Unbekannt',
        current: 'Aktuelle Sitzung',
        browser: 'Browser',
        last_active: 'Zuletzt aktiv',
        ip: 'IP',
        logout_all: 'Alle anderen Sitzungen abmelden'
      }
    },

    other_settings: {
      bbb: {
        title: 'BigBlueButton',
        skip_check_audio: 'Echo-Test deaktivieren'
      }
    },

    passwordResetSuccess: 'Passwort-Rücksetz-Mail wurde erfolgreich an {mail} verschickt!',
    timezone: 'Zeitzone'
  },

  roomTypes: {
    title: 'Raumarten',
    tileDescription: 'Die Raumarten sortieren die Räume, geben diesen Icons zur schnelleren Wiedererkennung und bestimmen auf welchem Serverpool ein Meeting stattfindet.',

    icon: 'Icon',
    description: 'Beschreibung',
    short: 'Icon Text',
    color: 'Icon Farbe',
    customColor: 'Eigene Farbe',
    preview: 'Vorschau',
    allowListing: 'Raumsuche erlaubt',
    allowListingDescription: 'In den Raumeinstellungen können Räume für die Raumsuche sichtbar geschaltet werden.',
    serverPool: 'Serverpool',
    selectServerPool: 'Serverpool auswählen',
    serverPoolDescription: 'Server dieses Serverpools werden für die Lastverteilung verwendet',
    new: 'Neue Raumart erstellen',
    view: 'Detaillierte Informationen für die Raumart {name}',
    edit: 'Raumart {name} bearbeiten',
    actions: 'Aktionen',
    nodata: 'Es sind keine Raumarten vorhanden!',
    delete: {
      item: 'Raumart {id} löschen',
      confirm: 'Wollen Sie die Raumart {name} wirklich löschen?',
      title: 'Raumart löschen?',
      replacement: 'Ersatzraumart',
      noReplacement: '-- Kein Ersatz --',
      replacementInfo: 'Wenn der Raumart noch Räume zugeordnet sind, muss ein Ersatz angegeben werden.'
    },
    restrict: 'Verwendung einschränken',
    restrictDescription: 'Die Verwendung dieser Raumart und der dazugehörigen Server wird nur für die nachfolgend angegebenen Rollen gestattet.',
    roles: 'Rollen',
    selectRoles: 'Rollen auswählen'
  },

  application: {
    title: 'Anwendung',
    tileDescription: 'Regelt systemweitere Einstellungen wie Logo, Wartungs-Banner und Seitengrößen.',
    defaultPresentation: 'Standard Präsentation',
    viewDefaultPresentation: 'Anzeigen',
    deleteDefaultPresentation: 'Löschen',
    resetDefaultPresentation: 'Zurücksetzen',
    logo: {
      title: 'Logo',
      uploadTitle: 'Logo hochladen (max. 500 KB)',
      urlTitle: 'URL zu Logo-Datei',
      description: 'URL zum Logo',
      hint: 'https://domain.tld/path/logo.svg',
      selectFile: 'Logo-Datei auswählen',
      alt: 'Logo Vorschau'
    },

    favicon: {
      title: 'Favicon',
      uploadTitle: 'Favicon hochladen (max. 500 KB, Format: .ico)',
      urlTitle: 'URL zu Favicon-Datei',
      description: 'URL zum Favicon',
      hint: 'https://domain.tld/path/favicon.ico',
      selectFile: 'Favicon-Datei auswählen',
      alt: 'Favicon Vorschau'
    },

    name: {
      title: 'Name der Anwendung',
      description: 'Ändert den Seitentitel'
    },

    helpUrl: {
      title: 'URL zur Hilfeseite',
      description: 'Wenn nicht gesetzt, wird kein Hilfe-Button angezeigt.'
    },

    roomLimit: {
      title: 'Anzahl der Räume pro Benutzer',
      description: 'Begrenzt die Anzahl der Räume, die ein Benutzer haben kann. Diese Einstellung wird von den gruppenspezifischen Grenzen überschrieben.'
    },

    paginationPageSize: {
      title: 'Größe der Paginierung',
      description: 'Begrenzt die Anzahl der gleichzeitig angezeigten Datensätze in Tabellen'
    },

    ownRoomsPaginationPageSize: {
      title: 'Größe der Paginierung für eigene Räume',
      description: 'Begrenzt die Anzahl der gleichzeitig angezeigten Räume auf der Startseite'
    },

    attendanceAndStatisticsTitle: 'Aufzeichnung und Statistik',
    roomsTitle: 'Räume',
    usersTitle: 'Benutzer',

    statistics: {
      servers: {
        enabledTitle: 'Auslastung der Server aufzeichnen',
        enabled: 'Aktivieren',
        retentionPeriodTitle: 'Speicherdauer der Serverauslastung in Tagen'
      },
      meetings: {
        enabledTitle: 'Auslastung der Meetings aufzeichnen',
        enabled: 'Aktivieren',
        retentionPeriodTitle: 'Speicherdauer der Meetingauslastung in Tagen'
      }
    },

    attendance: {
      enabledTitle: 'Protokollierung der Teilnehmeranwenheit in Meetings zulassen',
      enabled: 'Zulassen',
      retentionPeriodTitle: 'Speicherdauer der Anwesenheitsprotokollierung in Tagen'
    },

    banner: {
      title: 'Banner für Mitteilungen',
      enabled: 'Anzeigen',
      bannerTitle: 'Überschrift',
      message: 'Mitteilung',
      link: 'Anzuzeigender Link nach der Mitteilung',
      link_text: 'Linktext',
      link_target: 'Linkziel',
      link_style: 'Linkart',
      icon: 'Icon',
      iconDescription: 'Die CSS-Klasse des Fontawesome-Icons (z. B. `fa-solid fa-door-open`). Das Icon wird nur angezeigt, wenn ein Titel angegeben wurde.',
      color: 'Textfarbe des Banners',
      background: 'Hintergrundfarbe des Banners',
      selectLinkTarget: 'Linkziel auswählen',
      selectLinkStyle: 'Linkart auswählen'
    },

    userSettings: 'Benutzereinstellungen',
    passwordSelfResetEnabled: 'Registrierten Nutzern ermöglichen das Passwort zurückzusetzen und zu ändern',
    defaultTimezone: 'Standardzeitzone',

    roomTokenExpiration: {
      title: 'Ablaufzeit für personalisierte Raumlinks',
      description: 'Zeitraum ab der letzten Nutzung, wonach die personalisierte Raumlinks automatisch gelöscht werden.'
    },

    room_auto_delete: {
      enabled: {
        title: 'Ungenutzte Räume automatisch löschen',
        enabled: 'Aktivieren'
      },
      deadlinePeriod: {
        title: 'Löschfirst',
        description: 'Zeitraum zwischen Zustellung der Informations-Email und der Löschung'
      },
      inactivePeriod: {
        title: 'Zeitraum bis inaktive Räume gelöscht werden',
        description: 'Räume deren letztes Meeting länger als der Zeitraum zurückliegt'
      },
      neverUsedPeriod: {
        title: 'Zeitraum bis nie genutzte Räume gelöscht werden',
        description: 'Räume die vor dem Zeitraum erstellt, aber bisher noch nicht verwendet wurden'
      }
    },

    oneDay: '1 Tag (24 Stunden)',
    oneWeek: '1 Woche (7 Tage)',
    twoWeeks: '2 Wochen (14 Tage)',
    oneMonth: '1 Monat (30 Tage)',
    threeMonth: '3 Monate (90 Tage)',
    sixMonth: '6 Monate (180 Tage)',
    oneYear: '1 Jahr (365 Tage)',
    twoYears: '2 Jahre (730 Tage)',
    never: 'Nie',
    unlimited: 'Unbegrenzt',

    bbb: {
      title: 'BigBlueButton Anpassungen',
      logo: {
        title: 'Logo',
        uploadTitle: 'Logo hochladen (max. 500 KB)',
        urlTitle: 'URL zu Logo-Datei',
        description: 'URL zum Logo',
        hint: 'https://domain.tld/path/logo.svg',
        selectFile: 'Logo-Datei auswählen',
        alt: 'Logo Vorschau',
        delete: 'Löschen',
        reset: 'Zurücksetzen'
      },
      style: {
        title: 'CSS Style Datei',
        view: 'Anzeigen',
        delete: 'Löschen',
        reset: 'Zurücksetzen'
      }
    }
  },

  servers: {
    title: 'Server',
    tileDescription: 'Die Server stellen die BBB Infrastruktur für die Meetings bereit.',
    id: 'ID',
    name: 'Name',
    description: 'Beschreibung',
    status: 'Status',
    version: 'Version',
    participantCount: 'Teilnehmer',
    videoCount: 'Videos',
    ownMeetingCount: 'Eigene Meetings',
    ownMeetingDescription: 'Meetings, die von diesem System verwaltet werden',
    meetingCount: 'Meetings',
    meetingDescription: 'Alle Meetings auf dem BigBlueButton-Server',

    currentUsage: 'Aktuelle Auslastung',
    usageInfo: 'Die Auslastung (Meetings, Teilnehmer, Videos) beinhalten auch Meetings die von anderen Systemen verwaltet werden.',

    unknown: 'Unbekannt',
    online: 'Online',
    offline: 'Offline',
    disabled: 'Deaktiviert',
    disabledDescription: 'Bereits laufende Meetings werden durch eine Deaktivierung nicht beendet, neue können jedoch nicht erstellt werden',

    strength: 'Serverstärke',
    strengthDescription: 'Faktor für Lastverteilung; je höher desto mehr Teilnehmer und Meetings kann der Server verarbeiten',
    baseUrl: 'API Endpunkt',
    salt: 'API Geheimnis',
    showSalt: 'Klartext anzeigen',
    hideSalt: 'Klartext verbergen',
    testConnection: 'Verbindung testen',

    panic: 'Deaktivieren & Aufräumen',
    panicServer: 'Server deaktiveren und alle Meetings beenden',
    panicDescription: 'Es werden nur Meetings beendet, die über dieses System erstellt wurden!',
    panicFlash: {
      message: 'Der Server wurde deaktiviert. Es wurden {total} Meetings gefunden und {success} erfolgreich beendet.',
      title: 'Deaktivert und aufgeräumt'
    },

    reload: 'Auslastung neu bestimmen',
    new: 'Neuen Server hinzufügen',
    view: 'Detaillierte Informationen über Server {name}',
    edit: 'Server {name} bearbeiten',

    nodata: 'Es sind keine Server vorhanden!',
    nodataFiltered: 'Für die Suchanfrage wurden keine Server gefunden!',

    delete: {
      item: 'Server {name} löschen',
      confirm: 'Wollen Sie den Server {name} wirklich entfernen?',
      title: 'Server löschen?'
    },

    offlineReason: {
      connection: 'Der Verbindungsaufbau zum Server ist fehlgeschlagen.',
      salt: 'Es wurde eine Verbindung zum Server hergestellt, aber das API-Geheimnis ist ungültig.'
    }
  },
  serverPools: {
    title: 'Serverpools',
    tileDescription: 'Für die Lastverteilung werden mehrere Server gebündelt und über die Raumart jedem Raum zugewiesen.',
    id: 'ID',
    name: 'Name',
    description: 'Beschreibung',
    serverCount: 'Anzahl Server',
    servers: 'Server',

    select_servers: 'Server auswählen',
    removeServer: 'Server entfernen',

    new: 'Neuen Serverpool hinzufügen',
    view: 'Detaillierte Informationen über Serverpool {name}',
    edit: 'Serverpool {name} bearbeiten',

    nodata: 'Es sind keine Serverpools vorhanden!',
    nodataFiltered: 'Für die Suchanfrage wurden keine Serverpools gefunden!',

    delete: {
      item: 'Serverpool {name} löschen',
      confirm: 'Wollen Sie den Serverpool {name} wirklich entfernen?',
      title: 'Serverpool löschen?',
      failed: 'Serverpool kann nicht gelöscht werden, weil die folgenden Raumarten diesen noch verwenden:'
    }
  }
};
