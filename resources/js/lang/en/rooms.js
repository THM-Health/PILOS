export default {
  myRooms: 'My rooms',
  noRoomsAvailable: 'No rooms available',
  rooms: 'Rooms',
  sharedBy: 'Shared by {name}',
  sharedRooms: 'Rooms shared with me',
  start: 'Start',
  notRunning: 'This room is not started yet.',
  tryAgain: 'Try again',
  join: 'Join',
  firstAndLastname: 'First- und last name',
  accessForParticipants: 'Access for participants',
  onlyUsedByAuthenticatedUsers: 'This room can only be used by authenticated users.',
  becomeMember: 'Become member',
  endMembership: 'End membership',
  requireAccessCode: 'An access code is required to join this room',
  login: 'Login',
  flash: {
    notRunning: {
      message: 'The room is currently closed.',
      title: 'Joining failed'
    },
    startForbidden: {
      message: 'The room could not be started by you.',
      title: 'Starting failed'
    },
    errorRoomStart: {
      message: 'The room could not be started.',
      title: 'Starting failed'
    },
    accessCodeChanged: {
      message: 'The access code was changed in the meantime.',
      title: 'Access code invalid'
    },
    membershipDisabled: {
      message: 'A room membership isn\'t available at the moment.',
      title: 'Membership failed'
    }
  },
  files: {
    title: 'Files',
    filename: 'Filename',
    actions: 'Actions',
    default: 'Default',
    downloadable: 'Downloadable',
    uploadedAt: 'Uploaded at',
    useInNextMeeting: 'Use in the next meeting',
    selectordrag: 'Select a file or drag and drop it here...',
    modals: {
      delete: {
        title: 'Delete file',
        confirm: 'Do you want to delete this file {filename}?',
        yes: 'Yes',
        no: 'No'
      }
    }
  },
  invitation: {
    room: 'Join \'{roomname}\' with PILOS',
    link: 'Link: {link}',
    code: 'Access code: {code}'
  },
  members: {
    title: 'Members',
    addUser: 'Add user',
    inviteGuest: 'Invite guest',
    firstname: 'Firstname',
    lastname: 'Lastname',
    email: 'Email',
    role: 'Role',
    actions: 'Actions',
    roles: {
      guest: 'Guest',
      participant: 'Participant',
      moderator: 'Moderator'

    },
    modals: {
      edit: {
        title: 'Edit {firstname} {lastname}',
        save: 'Save',
        cancel: 'Cancel',
        role: 'Role'
      },
      add: {
        title: 'Add user',
        add: 'Add',
        cancel: 'Cancel',
        user: 'User',
        selectuser: 'Please select the user you would like to add',
        name: 'Name',
        noentries: 'No entries',
        nouserfound: 'Oops! No user was found for this query.',
        role: 'Role',
        selectrole: 'Please select a role'
      },
      delete: {
        title: 'Remove member from this room',
        confirm: 'Do you want to remove {firstname} {lastname} from this room?',
        yes: 'Yes',
        no: 'No'
      }
    }
  },
  statistics: {
    title: 'Statistics'
  },
  settings: {
    title: 'Settings',
    nonePlaceholder: '-- none --',
    saving: 'saving ...',
    general: {
      title: 'General',
      type: 'Type',
      roomName: 'Room name',
      welcomeMessage: 'Welcome message',
      maxDuration: 'Max. duration',
      minutes: 'min.',
      chars: 'Characters: {chars}'
    },
    security: {
      title: 'Security',
      unprotectedPlaceholder: '-- unprotected --',
      accessCode: 'Access code',
      accessCodeNote: 'Access restriction for joining the room and room membership (if enabled).',
      allowGuests: 'Allow guests',
      allowNewMembers: 'Allow new members'
    },
    participants: {
      title: 'Participants',
      maxParticipants: 'Max. participants',
      defaultRole: {
        title: 'Default role',
        onlyLoggedIn: '(only for authenticated users)',
        participant: 'Participant',
        moderator: 'Moderator'
      },
      waitingRoom: {
        title: 'Waiting room',
        disabled: 'Disabled',
        enabled: 'Enabled',
        onlyForGuestsEnabled: 'Enabled only for guests'
      }
    },
    permissions: {
      title: 'Permissions',
      everyoneStart: 'Everyone can start the meeting',
      muteMic: 'Mute microphone on join'
    },
    restrictions: {
      title: 'Restrictions',
      enabled: 'Enabled restrictions',
      disableCam: 'Disable webcam',
      onlyModSeeCam: 'Only moderators can see the webcam',
      disableMic: 'Disable microphone',
      disablePublicChat: 'Disable public chat',
      disablePrivateChat: 'Disable private chat',
      disableNoteEdit: 'Disable editing of notes',
      hideParticipantsList: 'Hide list of participants'
    }
  }

};
