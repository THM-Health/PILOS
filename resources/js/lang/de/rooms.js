export default {
  myRooms: 'Meine Räume',
  noRoomsAvailable: 'Keine Räume vorhanden',
  rooms: 'Räume',
  roomLimit: 'Max. Anzahl an Räumen: {has}/{max}',
  sharedBy: 'Geteilt von {name}',
  sharedRooms: 'Mit mir geteilte Räume',
  start: 'Starten',
  notRunning: 'Der Raum ist noch nicht gestartet.',
  tryAgain: 'Erneut versuchen',
  join: 'Teilnehmen',
  firstAndLastname: 'Vor- und Nachname',
  accessForParticipants: 'Zugang für Teilnehmer',
  onlyUsedByAuthenticatedUsers: 'Dieser Raum kann nur von angemeldeten Nutzern verwendet werden.',
  becomeMember: 'Mitglied werden',
  endMembership: 'Mitgliedschaft beenden',
  requireAccessCode: 'Für diesen Raum ist ein Zugangscode erforderlich',
  login: 'Anmelden',
  placeholderName: 'Max Mustermann',
  placeholderAccessCode: 'Zugangscode',
  flash: {
    noNewRoom: {
      message: 'Sie haben nicht die nötige Berechtigung um einen neuen Raum zu erstellen.',
      title: 'Keine Berechtigung'
    },
    startForbidden: {
      message: 'Der Raum kann von Ihnen nicht gestartet werden.',
      title: 'Starten fehlgeschlagen'
    },
    accessCodeChanged: {
      message: 'Der Zugangscode wurde in der Zwischenzeit geändert.',
      title: 'Zugangscode ungültig'
    },
    fileForbidden: {
      message: 'Die Zugriff auf die Datei wurde verweigert.',
      title: 'Zugriff verweigert'
    }
  },
  create: {
    title: 'Neuen Raum erstellen',
    ok: 'Erstellen',
    cancel: 'Abbrechen'
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
    selectordrag: 'Wählen Sie eine Datei aus, oder ziehen Sie eine Datei per Drag & Drop in dieses Feld ...',
    modals: {
      delete: {
        title: 'Datei löschen',
        confirm: 'Soll die Datei {filename} gelöscht werden?',
        yes: 'Ja',
        no: 'Nein'
      }
    },
    formats: 'Erlaubte Dateiformate: {formats}',
    size: 'Max. Dateigröße: {size} MB',
    validation: {
      tooLarge: 'Die ausgewählte Datei ist zu groß.'
    }
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
        selectUser: 'Bitte wählen Sie einen Benutzer aus',
        name: 'Name',
        noOptions: 'Keine Einträge, bitte suchen Sie nach einem Benutzer.',
        noResult: 'Oops! Für diesen Suchbegriff konnten keine Benutzer gefunden werden.',
        role: 'Rolle',
        selectRole: 'Bitte wählen Sie eine Rolle aus'
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
    saving: 'Einstellungen werden gespeichert ...',
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
      disablePublicChat: 'Öffentlichen Chat deaktivieren',
      disablePrivateChat: 'Private Chats deaktivieren',
      disableNoteEdit: 'Bearbeiten der Notizen deaktivieren',
      hideParticipantsList: 'Teilnehmerliste verbergen'
    }
  }
};
