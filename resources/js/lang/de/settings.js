export default {
  title: 'Einstellungen',
  description: 'Hier können die Einstellungen der Anwendung verwaltet werden.<br>' +
    'Bitte wählen Sie einen der nebenstehenden Menüpunkte, um die Einstellungen anzupassen.',

  roles: {
    title: 'Rollen',

    new: 'Neue Rolle erstellen',
    view: 'Detaillierte Informationen für die Rolle {name}',
    edit: 'Rolle {name} bearbeiten',

    id: 'ID',
    name: 'Name',
    permissions: 'Rechte',
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

    new: 'Neuen Benutzer erstellen',
    view: 'Detaillierte Informationen für den Benutzer {firstname} {lastname}',
    edit: 'Benutzer {firstname} {lastname} bearbeiten',

    nodata: 'Es sind keine Benutzer vorhanden!',
    nodataFiltered: 'Für die Suchanfrage wurden keine Benutzer gefunden!',

    id: 'ID',
    firstname: 'Vorname',
    lastname: 'Nachname',
    email: 'E-Mail',
    password: 'Passwort',
    password_confirmation: 'Passwort bestätigen',
    user_locale: 'Sprache',
    roles: 'Rollen',
    select_roles: 'Bitte wählen Sie mindestens eine Rolle aus',
    select_locale: 'Bitte wählen Sie eine Sprache aus',
    removeRole: 'Rolle entfernen',

    base_data: 'Stammdaten',
    room_settings: 'Benutzerdefinierte Raumeinstellungen',
    skip_check_audio: 'Echo-Test deaktivieren',

    authenticator: {
      title: 'Anmeldeart',
      users: 'Registrierter Nutzer',
      ldap: 'LDAP'
    },

    delete: {
      item: 'Benutzer {firstname} {lastname} löschen',
      confirm: 'Wollen Sie den Benutzer {firstname} {lastname} wirklich löschen?',
      title: 'Benutzer löschen?'
    }
  },

  roomTypes: {
    title: 'Raumarten',
    icon: 'Icon',
    description: 'Beschreibung',
    short: 'Icon Text',
    color: 'Icon Farbe',
    customColor: 'Eigene Farbe',
    preview: 'Vorschau',
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
    loadingError: 'Beim Laden der Raumarten ist ein Fehler aufgetreten.'
  },

  application: {
    title: 'Anwendung',
    logo: {
      title: 'Logo',
      uploadTitle: 'Logo hochladen (max. 500 KB)',
      urlTitle: 'URL zu Logo-Datei',
      description: 'URL zum Logo',
      hint: 'https://domain.tld/path/logo.svg',
      selectFile: 'Logo-Datei auswählen',
      alt: 'Favicon Vorschau'
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
      iconDescription: 'Die CSS-Klasse des Fontawesome-Icons (z. B. `fas fa-door-open`). Das Icon wird nur angezeigt, wenn ein Titel angegeben wurde.',
      color: 'Textfarbe des Banners',
      background: 'Hintergrundfarbe des Banners',
      selectLinkTarget: 'Linkziel auswählen',
      selectLinkStyle: 'Linkart auswählen'
    }
  }
};
