export default {
  myRooms: 'My rooms',
  noRoomsAvailable: 'No rooms available',
  rooms: 'Rooms',
  roomLimit: 'Room limit: {has}/{max}',
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
  placeholderName: 'John Doe',
  placeholderAccessCode: 'Access code',
  flash: {
    roomLimitExceeded: {
      message: 'You have reached the max. amount of rooms.',
      title: 'Creating room failed'
    },
    noNewRoom: {
      message: 'You do not have the necessary permission to create a new room.',
      title: 'Permission denied'
    },
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
      message: 'A room membership is not available at the moment.',
      title: 'Membership failed'
    },
    fileGone: {
      message: 'The requested file was not found.',
      title: 'Not found'
    },
    fileForbidden: {
      message: 'The access to the requested file was forbidden.',
      title: 'Access forbidden'
    }
  },
  create: {
    title: 'Create new room',
    ok: 'Create',
    cancel: 'Cancel'
  },
  files: {
    title: 'Files',
    nodata: 'No files available',
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
    },
    formats: 'Allowed file formats: {formats}',
    size: 'Max. file size: {size} MB',
    validation: {
      tooLarge: 'The selected file is too large.'
    }
  },
  invitation: {
    room: 'Join \'{roomname}\' with PILOS',
    link: 'Link: {link}',
    code: 'Access code: {code}'
  },
  members: {
    title: 'Members',
    nodata: 'No members available',
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
        selectUser: 'Please select the user you would like to add',
        name: 'Name',
        noOptions: 'No entries, please search for a user.',
        noResult: 'Oops! No user was found for this query.',
        role: 'Role',
        selectRole: 'Please select a role'
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
