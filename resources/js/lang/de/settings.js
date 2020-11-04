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
    }
  }
};
