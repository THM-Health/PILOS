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
      custom: 'Benutzerdefinierter Wert'
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
    save: 'Abspeichern',

    brandImage: {
      title: 'Markenbild',
      description: 'Sie können hier das Markenbild, das in der linken oberen Ecke erscheint, ändern.'
    },

    themeColor: {
      title: 'Themenfarbe',
      regularTitle: 'Regulär',
      lightenTitle: 'Hell',
      darkenTitle: 'Dunkel',
      description: 'Hier können Sie die Themenfarbe ändern.'
    },

    registrationMethod: {
      title: 'Registrierungsmethode',
      open: 'offene Registrierung',
      invitation: 'Beitritt auf Einladung',
      description: 'Sie können hier die Registrierungsmethode ändern.'
    },

    roomAuthentication: {
      title: 'Raum-Authentifizierung',
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
      description: 'Nur authentifizierte Benutzer dürfen einem Raum beitreten.'
    },

    roomShare: {
      title: 'Benutzer erlauben, den Raum zu verteilen.',
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
      description: 'Wenn Sie auf deaktiviert setzen, wird die Schaltfläche aus der Dropdown-Liste Raumoptionen entfernt, wodurch Benutzer daran gehindert werden, Räume zu verteilen.'
    },

    recordingVisibility: {
      title: 'Standard-Sichtbarkeit für die Aufzeichnung',
      public: 'öffentlich',
      unlisted: 'nicht aufgelistet',
      description: 'Sie können hier die Standard-Sichtbarkeit von Aufzeichnungen für neue Aufzeichnungen festlegen.'
    },

    roomsPerUser: {
      title: 'Anzahl der Räume pro Benutzer',
      description: 'Begrenzt die Anzahl der Räume, die ein Benutzer haben kann. Diese Einstellung gilt nicht für Administratoren.',
      option: {
        one: '1',
        five: '5',
        ten: '10',
        unlimited: 'Unbegrenzt'
      }
    }
  }
};
