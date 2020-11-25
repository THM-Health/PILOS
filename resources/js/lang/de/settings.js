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
    actions: 'Aktionen',
    nodata: 'Es sind keine Rollen vorhanden!',

    noOptions: 'Keine Berechtigungen vorhanden!',

    delete: {
      item: 'Rolle {id} löschen',
      confirm: 'Wollen Sie die Rolle {name} wirklich löschen?',
      title: 'Rolle löschen?'
    }
  },

  users: {
    title: 'Benutzer'
  },

  application: {
    title: 'Anwendung',
    logo: {
      title: 'Logo',
      uploadTitle: 'Logo hochladen (max. 500 KB)',
      urlTitle: 'URL zu Logo-Datei',
      description: 'URL zum Logo',
      hint: 'https://domain.tld/path/logo.svg',
      selectFile: 'Logo-Datei auswählen'
    },

    favicon: {
      title: 'Favicon',
      uploadTitle: 'Favicon hochladen (max. 500 KB, Format: .ico)',
      urlTitle: 'URL zu Favicon-Datei',
      description: 'URL zum Favicon',
      hint: 'https://domain.tld/path/favicon.ico',
      selectFile: 'Favicon-Datei auswählen'
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
    }
  }
};
