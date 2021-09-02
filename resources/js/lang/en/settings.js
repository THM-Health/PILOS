export default {
  title: 'Settings',
  homeButton: 'Back to the overview',
  overview: 'Overview',
  overviewDescription: 'Here you can manage the settings of the application. Please select one of the menu items on the left to adjust the settings.',

  roles: {
    title: 'Roles',
    tileDescription: 'The roles assign permissions, organise the users and define the maximum number of rooms per user.',
    new: 'Create new role',
    view: 'Detailed information for the role {name}',
    edit: 'Edit role {name}',

    id: 'ID',
    name: 'Name',
    permissions: 'Permissions',
    permissionName: 'Name of the permissions',
    permissionExplicit: 'Explicit',
    permissionIncluded: 'Included',
    permissionIncludedHelp: 'Permissions that have been selected and permissions that are included in the selected permissions.',
    hasIncludedPermission: 'The permission "{name}" was either explicitly selected or is included in another selected permission.',
    hasNotIncludedPermission: 'The permission "{name}" was neither explicitly selected nor is it included in another selected permission.',
    roomLimit: {
      label: 'Room limit',
      default: 'System default ({value})',
      unlimited: 'Unlimited',
      custom: 'Custom amount',
      helpModal: {
        title: 'Room limit',
        info: 'The room limit of a user results from the maximum of the room limits of the roles a user belongs to.',
        examples: 'Examples',
        systemDefault: 'System default',
        roleA: 'Role A',
        roleB: 'Role B',
        maxAmount: 'Room limit',
        note: 'X: User is not member of this role'
      }
    },
    default: 'Default',
    nodata: 'No roles found!',

    noOptions: 'No permissions found!',

    delete: {
      item: 'Delete role {id}',
      confirm: 'Do you really want to delete the role {name}?',
      title: 'Delete role?'
    }
  },

  users: {
    title: 'Users',
    tileDescription: 'Users can login to the system and use different features depending on their role.',
    new: 'Create new user',
    view: 'Detailed information for the user {firstname} {lastname}',
    edit: 'Edit user {firstname} {lastname}',

    nodata: 'No users found!',
    nodataFiltered: 'For the filter query no users were found!',

    image: {
      title: 'Profile picture',
      upload: 'Upload new picture',
      crop: 'Crop profile picture',
      save: 'confirm',
      cancel: 'cancel',
      delete: 'Delete picture',
      undo_delete: 'Undo deletion',
      invalidMime: {
        message: 'The file format is not supported. Please select a jpg or png file.',
        title: 'Invalid file format'
      }
    },

    base_data: 'Base data',
    room_settings: 'Custom room settings',
    skip_check_audio: 'Disable echo audio test',

    generate_password: 'Generate password',
    generate_password_description: 'A generated password will be set and an email with a reset link will be sent to the user. The user will be automatically deleted, if he doesn\'t change his password in the given time.',

    id: 'ID',
    firstname: 'Firstname',
    lastname: 'Lastname',
    email: 'E-Mail',
    password: 'Password',
    password_confirmation: 'Password confirmation',
    user_locale: 'Language',
    roles: 'Roles',
    select_roles: 'Please select at least one role',
    select_locale: 'Please select a language',
    removeRole: 'Remove role',
    authenticator: {
      title: 'Authentication Type',
      users: 'Registered User',
      ldap: 'LDAP'
    },

    delete: {
      item: 'Delete user {firstname} {lastname}',
      confirm: 'Are you really want to delete the user {firstname} {lastname}?',
      title: 'Delete user?'
    },

    resetPassword: {
      item: 'Reset password for the user {firstname} {lastname}',
      confirm: 'Are you really want to reset the password for {firstname} {lastname}?',
      title: 'Reset password?'
    },

    passwordResetSuccess: 'Password reset mail was successfully send to {mail}!',
    timezone: 'Timezone'
  },

  roomTypes: {
    title: 'Room types',
    tileDescription: 'The room types organize the rooms, give them icons for quicker recognition and determine on which server pool a meeting takes place.',
    icon: 'Icon',
    description: 'Description',
    short: 'Icon text',
    color: 'Icon color',
    customColor: 'Custom color',
    preview: 'Preview',
    allowListing: 'Room search allowed',
    allowListingDescription: 'In the room settings the rooms can be made visible for the room search.',
    serverPool: 'Server pool',
    selectServerPool: 'Select server pool',
    serverPoolDescription: 'Servers of this server pool are used for load balancing',
    new: 'Create new room type',
    view: 'Detailed information for the room type {name}',
    edit: 'Edit room type {name}',
    actions: 'Actions',
    nodata: 'No room types found!',
    delete: {
      item: 'Delete room type {id}',
      confirm: 'Do you really want to delete the room type {name}?',
      title: 'Delete room type?',
      replacement: 'Room type replacement',
      noReplacement: '-- No replacement --',
      replacementInfo: 'If there are rooms associated with this room type, you need to select a replacement room type.'
    },
    loadingError: 'An error occurred during loading of the room types.',
    restrict: 'Restrict usage',
    restrictDescription: 'The usage of this room type and the corresponding servers will be restricted to the selected roles.',
    roles: 'Roles',
    selectRoles: 'Select roles'
  },

  application: {
    title: 'Application',
    tileDescription: 'Controls system-wide settings such as logo, maintenance banner and page sizes.',
    defaultPresentation: 'Default presentation',
    viewDefaultPresentation: 'View',
    deleteDefaultPresentation: 'Delete',
    resetDefaultPresentation: 'Reset',
    logo: {
      title: 'Logo',
      uploadTitle: 'Upload a logo (max. 500 KB)',
      urlTitle: 'URL to logo file',
      description: 'Changes the application logo. Enter the image URL',
      hint: 'https://domain.tld/path/logo.svg',
      selectFile: 'Select logo file',
      alt: 'Logo preview'
    },

    favicon: {
      title: 'Favicon',
      uploadTitle: 'Upload a favicon (max. 500 KB, Format: .ico)',
      urlTitle: 'URL to favicon file',
      description: 'Changes the application favicon. Enter the favicon URL',
      hint: 'https://domain.tld/path/favicon.ico',
      selectFile: 'Select favicon file',
      alt: 'Favicon preview'
    },

    name: {
      title: 'Name of the application',
      description: 'Changes the site title'
    },

    helpUrl: {
      title: 'URL to the help',
      description: 'If not set, no help button will be displayed.'
    },

    roomLimit: {
      title: 'Number of rooms per user',
      description: 'Limits the number of rooms that a user can have. This setting does not apply to administrators.  Enter the value -1 for unlimited number of rooms'
    },

    paginationPageSize: {
      title: 'Pagination page size',
      description: 'Limits the number of page size for data tables pagination'
    },

    ownRoomsPaginationPageSize: {
      title: 'Own rooms pagination page size',
      description: 'Limits the number of page size for own rooms pagination'
    },

    statistics: {
      servers: {
        enabledTitle: 'Record server utilisation',
        enabled: 'Enable',
        retentionPeriodTitle: 'Retention period of the server utilisation in days'
      },
      meetings: {
        enabledTitle: 'Record utilisation of meetings',
        enabled: 'Enable',
        retentionPeriodTitle: 'Retention period of the meeting utilisation in days'
      }
    },

    attendance: {
      enabledTitle: 'Allow logging of participant attendance at meetings',
      enabled: 'Enable',
      retentionPeriodTitle: 'Retention period of the attendance logging in days'
    },

    banner: {
      title: 'Banner for messages',
      enabled: 'Show',
      bannerTitle: 'Title',
      message: 'Message',
      link: 'Link to show after the message',
      link_text: 'Link text',
      link_target: 'Link target',
      link_style: 'Link style',
      icon: 'Icon',
      iconDescription: 'The CSS class of the Fontawesome-Icon (e. g. `fas fa-door-open`). The icon will only be visible, if a title is supplied.',
      color: 'Text color of the banner',
      background: 'Background color of the banner',
      selectLinkTarget: 'Select link target',
      selectLinkStyle: 'Select link style'
    },

    userSettings: 'User settings',
    passwordSelfResetEnabled: 'Give registered users the possibility to reset their password',
    defaultTimezone: 'Default timezone'
  },

  servers: {
    title: 'Server',
    tileDescription: 'The servers provide the BBB infrastructure for the meetings.',
    id: 'ID',
    name: 'Name',
    description: 'Description',
    status: 'Status',
    participantCount: 'Participants',
    videoCount: 'Videos',
    ownMeetingCount: 'Own meetings',
    ownMeetingDescription: 'Meetings that are managed by this system',
    meetingCount: 'Meetings',
    meetingDescription: 'All meetings on the BigBlueButton-Server',

    currentUsage: 'Current usage',
    usageInfo: 'The usage (meetings, participants, videos) also contains meetings that are managed by other systems.',

    unknown: 'Unknown',
    online: 'Online',
    offline: 'Offline',
    disabled: 'Disabled',
    disabledDescription: 'Currently running meetings are not stopped if server gets disabled, but no new meetings are started',

    strength: 'Server strength',
    strengthDescription: 'Load balancing factor; the higher the factor, the more participants and meetings the server can handle',
    baseUrl: 'API endpoint',
    salt: 'API secret',
    showSalt: 'Show clear text',
    hideSalt: 'Hide clear text',
    testConnection: 'Test connection',

    panic: 'Disable & cleanup',
    panicServer: 'Disable server and end all meetings',
    panicDescription: 'Only meetings managed by this system are stopped!',
    panicFlash: {
      message: 'The server has been disabled. {total} meetings were found and {success} were successfully stopped.',
      title: 'Disabled and cleaned'
    },

    reload: 'Recalculate usage',
    new: 'Add new server',
    view: 'Detailed information for the server {name}',
    edit: 'Edit server {name}',

    nodata: 'No servers found!',
    nodataFiltered: 'For the filter query no servers were found!',

    delete: {
      item: 'Delete server {name}',
      confirm: 'Do you really want to delete the server {name}?',
      title: 'Delete server?'
    },

    offlineReason: {
      connection: 'No connection could be established to the server.',
      salt: 'A connection to the server could be established, but the API secret is invalid.'
    }
  },
  serverPools: {
    title: 'Server pools',
    tileDescription: 'For load balancing several servers are bundled and assigned to each room via the room type.',
    id: 'ID',
    name: 'Name',
    description: 'Description',
    serverCount: 'Number of servers',
    servers: 'Server',

    select_servers: 'Select server',
    removeServer: 'Remove server',

    new: 'Create new server pool',
    view: 'Detailed information for the server pool {name}',
    edit: 'Edit server pool {name}',

    nodata: 'No server pools found!',
    nodataFiltered: 'For the filter query no server pools were found!',

    delete: {
      item: 'Delete server pool {name}',
      confirm: 'Are you really want to delete the server pool {name}?',
      title: 'Delete server pool?',
      failed: 'Server pool can\'t be deleted because the following room types still use it:'
    }
  }
};
