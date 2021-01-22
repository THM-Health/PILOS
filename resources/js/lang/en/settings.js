export default {
  title: 'Settings',
  description: 'Here you can manage the settings of the application.<br>' +
    'Please select one of the menu items on the left to adjust the settings.',

  roles: {
    title: 'Roles',

    new: 'Create new role',
    view: 'Detailed information for the role {name}',
    edit: 'Edit role {name}',

    id: 'ID',
    name: 'Name',
    permissions: 'Permissions',
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

    new: 'Create new user',
    view: 'Detailed information for the user {firstname} {lastname}',
    edit: 'Edit user {firstname} {lastname}',

    nodata: 'No users found!',
    nodataFiltered: 'For the filter query no users were found!',

    base_data: 'Base data',
    room_settings: 'Custom room settings',
    skip_check_audio: 'Disable echo audio test',

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
    }
  },

  roomTypes: {
    title: 'Room types',
    icon: 'Icon',
    description: 'Description',
    short: 'Icon text',
    color: 'Icon color',
    customColor: 'Custom color',
    preview: 'Preview',
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
    loadingError: 'An error occurred during loading of the room types.'
  },

  application: {
    title: 'Application',
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

    password_self_reset_enabled: 'Give registered users the possibility to reset their password'
  },

  servers: {
    title: 'Server',
    id: 'ID',
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
    view: 'Detailed information for the server {id}',
    edit: 'Edit server {id}',

    nodata: 'No servers found!',
    nodataFiltered: 'For the filter query no servers were found!',

    delete: {
      item: 'Delete server {id}',
      confirm: 'Do you really want to delete the server {id}?',
      title: 'Delete server?'
    },

    offlineReason: {
      connection: 'No connection could be established to the server.',
      salt: 'A connection to the server could be established, but the API secret is invalid.'
    }
  }
};
