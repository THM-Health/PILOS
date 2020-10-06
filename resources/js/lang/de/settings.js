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
    preview: 'Vorschauen',

    numberOptions: {
      one: '1',
      five: '5',
      ten: '10',
      fifteen: '15',
      thirty: '30',
      fifty: '50',
      unlimited: 'Unbegrenzt'
    },

    updateSettingsSuccess: {
      message: 'Einstellung wurde erfolgreich aktualisiert!',
      title: 'Einstellung'
    },

    logo: {
      title: 'Logo',
      description: 'Das Anwendungslogo ändern. Bild URL eingeben',
      hint: 'Bild URL'
    },

    roomLimit: {
      title: 'Anzahl der Räume pro Benutzer',
      description: 'Begrenzt die Anzahl der Räume, die ein Benutzer haben kann. Diese Einstellung gilt nicht für Administratoren'
    },

    paginationPageSize: {
      title: 'Größe der Paginierung',
      description: 'Begrenzt die Seitengrößen für die Paginierung der Datentabellen'
    },

    ownRoomsPaginationPageSize: {
      title: 'Größe der Paginierung für eigene Räume',
      description: 'Begrenzt die Seitengrößen für die Paginierung der eigenen Räume'
    }
  }
};
