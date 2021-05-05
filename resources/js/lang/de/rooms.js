export default {
  myRooms: 'Meine Räume',
  allRooms: 'Alle Räume',
  findRooms: 'Räume finden',
  findRoomsInfo: 'Liste aller öffentlich gelisteten Räume ohne Zugangscode',
  noRoomsAvailable: 'Keine Räume vorhanden',
  noRoomsAvailableSearch: 'Keine Räume für diesen Suchbegriff gefunden',
  rooms: 'Räume',
  roomLimit: 'Max. Anzahl an Räumen: {has}/{max}',
  sharedBy: 'Geteilt von {name}',
  sharedRooms: 'Mit mir geteilte Räume',
  start: 'Starten',
  notRunning: 'Der Raum ist noch nicht gestartet.',
  tryAgain: 'Erneut versuchen',
  join: 'Teilnehmen',
  recordingAttendanceInfo: 'Die Anwesenheit in diesem Raum wird protokolliert.',
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
    accessCodeInvalid: {
      message: 'Der Zugangscode ist ungültig.',
      title: 'Anmeldung am Raum fehlgeschlagen'
    },
    fileForbidden: {
      message: 'Die Zugriff auf die Datei wurde verweigert.',
      title: 'Zugriff verweigert'
    }
  },
  modals: {
    delete: {
      title: 'Raum löschen',
      confirm: 'Soll der Raum "{name}" gelöscht werden?'
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
        confirm: 'Soll die Datei {filename} gelöscht werden?'
      }
    },
    formats: 'Erlaubte Dateiformate: {formats}',
    size: 'Max. Dateigröße: {size} MB',
    termsOfUse: {
      title: 'Nutzungsbedingungen',
      content: 'Dateien, welche hier zum Download angeboten werden, sind ausschließlich für das persönliche Studium. Die Dateien, oder Inhalte aus diesen, dürfen nicht geteilt oder weiterverbreitet werden.',
      accept: 'Ich akzeptiere die Nutzungsbedingungen'
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
      moderator: 'Moderator',
      co_owner: 'Mitbesitzer'
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
        confirm: 'Soll {firstname} {lastname} aus dem Raum entfernt werden?'
      }
    }
  },
  meetingHistory: {
    title: 'Historie'
  },
  settings: {
    title: 'Einstellungen',
    nonePlaceholder: '-- keine --',
    saving: 'Einstellungen werden gespeichert ...',
    general: {
      title: 'Allgemein',
      type: 'Art',
      selectType: '-- Raumart auswählen --',
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
      allowNewMembers: 'Neue Mitglieder zulassen',
      listed: 'In Raumsuche einschließen'
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
      },
      recordAttendance: 'Anwesenheit protokollieren'
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
  },
  filter: {
    title: 'Filter',
    roomTypes: 'Raumarten',
    apply: 'Anwenden'
  }
};
