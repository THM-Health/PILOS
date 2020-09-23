export default {
  title: 'Einstellungen',
  description: 'Hier können die Einstellungen der Anwendung verwaltet werden.<br>' +
    'Bitte wählen Sie einen der nebenstehenden Menüpunkte, um die Einstellungen anzupassen.',
  users: {
    title: 'Benutzer',
    titleDatabaseCard: 'Datenbank Informationen',
    tooltip: {
      create: 'Benutzer erstellen.',
      invite: 'Benutzer einladen.',
      removeEmail: 'anklicken zum Entfernen'
    },
    fields: {
      id: 'Benutzer ID',
      authenticator: 'Authenticator',
      email: 'Email',
      name: 'Name',
      firstname: 'Vorname',
      lastname: 'Nachname',
      username: 'Benutzername',
      created: 'Erstellt',
      updated: 'Aktualisiert',
      guid: 'GUID',
      actions: 'Aktionen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      details: 'Details',
      password: 'Kennwort',
      passwordConfirmation: 'Kennwort Bestätigung'
    },
    modal: {
      create: 'Benutzer erstellen',
      update: 'Benutzer bearbeiten',
      delete: 'Bestätigung zum Löschen',
      deleteContent: 'Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden!',
      invite: 'Nutzer einladen',
      invitePlaceholder: 'Emailaddresse',
      inviteButton: 'Einladung schicken',
      inviteFooterMessage: 'Der Nutzer wird eine Email mit Anweisungen erhalten, wie er sich registrieren kann',
      inviteEmailError: 'Falsches E-Mail-Format und Duplikate sind nicht erlaubt!',
      submit: 'Abschicken'
    },
    createSuccess: {
      message: 'Benutzer wurde erfolgreich erstellt!',
      title: 'Erstellen'
    },
    createFailed: {
      message: 'Etwas ist schief gelaufen! Versuchen Sie es erneut!',
      title: 'Erstellen'
    },
    deleteSuccess: {
      message: 'Benutzer wurde erfolgreich gelöscht!',
      title: 'Löschen'
    },
    deleteFailed: {
      message: 'Etwas ist schief gelaufen! Versuchen Sie es erneut!',
      title: 'Löschen'
    },
    editSuccess: {
      message: 'Benutzer wurde erfolgreich geändert!',
      title: 'Bearbeiten'
    },
    editFailed: {
      message: 'Etwas ist schief gelaufen! Versuchen Sie es erneut!',
      title: 'Bearbeiten'
    },
    inviteSuccess: {
      message: 'Die Einladung wurde erfolgreich geschickt!',
      title: 'Einladung'
    },
    inviteFailed: {
      message: 'Etwas ist schief gelaufen! Versuchen sie es erneut',
      title: 'Einladung'
    }
  },

  rooms: {
    title: 'Serverräume'
  },

  recordings: {
    title: 'Serveraufzeichnungen'
  },

  siteSettings: {
    title: 'Seiteneinstellungen'
  },

  roles: {
    title: 'Rollen'
  }
};
