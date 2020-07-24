export default {
  myRooms: 'Meine Räume',
  noRoomsAvailable: 'Keine Räume vorhanden',
  rooms: 'Räume',
  sharedBy: 'Geteilt von {name}',
  sharedRooms: 'Mit mir geteilte Räume',
  start: 'Starten',
  notRunning: 'Der Raum ist noch nicht gestartet.',
  tryAgain: 'Erneut versuchen',
  join: 'Teilnehmen',
  firstAndLastname: 'Vor- und Nachname',
  accessForParticipants: 'Zugang für Teilnehmer',
  onlyUsedByLoggedInUsers: 'Dieser Raum kann nur von angemeldeten Nutern verwendet werden.',
  becomeMember: 'Mitglied werden',
  endMembership: 'Mitgliedschaft beenden',
  requireAccessCode: 'Für diesen Raum ist ein Zugangscode erforderlich',
  login: 'Anmelden',
  flash: {
    notRunning: {
      message: 'Der Raum ist aktuell geschlossen.',
      title: 'Teilnahme fehlgeschlagen'
    },
    startForbidden: {
      message: 'Der Raum kann von Ihnen nicht gestartet werden.',
      title: 'Starten fehlgeschlagen'
    },
  },


  files: {
    title: 'Dateien',
    nodata: 'Keine Dateien vorhanden',
    filename: 'Dateiname',
    actions: 'Aktionen',
    default: 'Standard',
    downloadable: 'Herunterladbar',
    uploadedAt: 'Hochgeladen am',
    useInNextMeeting: 'Im nächsten Meeting nutzen',
    selectordrag: 'Wähle eine Datei aus, oder ziehe sie hier hin...',
    modals: {
      delete: {
        title: 'Datei löschen',
        confirm: 'Soll die Datei {filename} gelöscht werden?',
        yes: 'Ja',
        no: 'Nein'
      }
    },
    flash: {
      deleted: {
        message: 'Die Datei wurde erfolgreich gelöscht',
        title: 'Gelöscht'
      },
    },
  },
  invitation: {
    room: 'An "{roomname}" mit PILOS teilnehmen',
    link: 'Link: {link}',
    code: 'Zugangscode: {code}'
  },
  members: {
    title: 'Mitglieder',
    nodata: 'Keine Mitglieder vorhanden',
    addUser: 'Nutzer hinzufügen',
    inviteGuest: 'Gast einladen',
    firstname: 'Vorname',
    lastname: 'Nachname',
    email: 'Email',
    role: 'Rolle',
    actions: 'Aktionen',
    roles: {
      guest: 'Gast',
      participant: 'Teilnehmer',
      moderator: 'Moderator'

    },
    modals: {
      edit: {
        title: '{firstname} {lastname} bearbeiten',
        save: 'Speichern',
        cancel: 'Abbrechen',
        role: 'Rolle'
      },
      add: {
        title: 'Nutzer hinzufügen',
        add: 'Hinzufügen',
        cancel: 'Abbrechen',
        user: 'Benutzer',
        selectuser: 'Bitte wähle einen Benutzer aus',
        name: 'Name',
        noentries: 'Keine Einträge',
        nouserfound: 'Oops! Für diesen Suchbegriff konnten keine Benutzer gefunden werden.',
        role: 'Rolle',
        selectrole: 'Bitte wähle eine Rolle aus'
      },
      delete: {
        title: 'Mitglied aus dem Raum entfernen',
        confirm: 'Soll {firstname} {lastname} aus dem Raum entfernt werden?',
        yes: 'Ja',
        no: 'Nein'
      }
    }
  },
  statistics: {
    title: 'Statistiken'
  },
  settings: {
    title: 'Einstellungen',
    nonePlaceholder: '-- keine --',
    saving: 'speichern ...',
    general: {
      title: 'Allgemein',
      type: 'Art',
      roomName: 'Raumname',
      welcomeMessage: 'Begrüßungsnachricht',
      maxDuration: 'Max. Dauer',
      minutes: 'min.',
      chars: 'Zeichen: {chars}'
    },
    security: {
      title: 'Sicherheit',
      unprotectedPlaceholder: '-- ungeschützt --',
      accessCode: 'Zugangscode',
      accessCodeNote: 'Zugangsbeschränkung für die Teilnahme und Mitgliedschaft (wenn aktiviert).',
      allowGuests: 'Gäste zulassen',
      allowNewMembers: 'Neue Mitglieder zulassen'
    },
    participants: {
      title: 'Teilnehmer',
      maxParticipants: 'Max. Teilnehmeranzahl',
      defaultRole: {
        title: 'Standardrolle',
        onlyLoggedIn: '(nur für angemeldete Nutzer)',
        participant: 'Teilnehmer',
        moderator: 'Moderator'
      },
      waitingRoom: {
        title: 'Warteraum',
        disabled: 'Deaktiviert',
        enabled: 'Aktiviert',
        onlyForGuestsEnabled: 'Aktiviert für Gäste'
      }
    },
    permissions: {
      title: 'Berechtigungen',
      everyoneStart: 'Jeder darf das Meeting starten',
      muteMic: 'Mikrofon bei Beitritt stummschalten'
    },
    restrictions: {
      title: 'Einschränkungen',
      enabled: 'Einschränkungen aktivieren',
      disableCam: 'Webcam deaktivieren',
      onlyModSeeCam: 'Webcam nur für Moderatoren sichtbar',
      disableMic: 'Mikrofon deaktivieren',
      disablePublicChat: 'Öffentlicher Chat deaktivieren',
      disablePrivateChat: 'Private Chats deaktivieren',
      disableNoteEdit: 'Bearbeiten der Notizen deaktivieren',
      hideParticipantsList: 'Teilnehmerliste verbergen'
    }
  }
}
