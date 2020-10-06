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
    view: 'Detaillierte Informationen für den Nutzer {firstname} {lastname}',
    edit: 'Nutzer {firstname} {lastname} bearbeiten',

    nodata: 'Es sind keine Benutzer vorhanden!',
    nodataFiltered: 'Für die Suchanfrage wurden keine Benutzer gefunden!',

    id: 'ID',
    firstname: 'Vorname',
    lastname: 'Nachname',
    email: 'E-Mail',
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
  }
};
