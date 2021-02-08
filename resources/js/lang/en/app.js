export default {
  wait: 'Please wait...',
  error: 'An error occurred!',
  notFound: '404 | The requested route doesn\'t exists!',
  selectLocale: 'Please select a language',
  reload: 'Reload',
  yes: 'Yes',
  no: 'No',
  search: 'Search',
  actions: 'Actions',
  profile: 'Profile',
  flash: {
    clientError: {
      message: 'An unknown error occurred in the application!',
      title: 'Error'
    },

    tooLarge: {
      message: 'The transmitted data was too large!',
      title: 'Error'
    },

    guestsOnly: {
      message: 'The request can only be done by guests!',
      title: 'Only for guests'
    },

    serverError: {
      message: '{message}',
      emptyMessage: 'An error occurred on the server during request!',
      title: 'Server-Error: {statusCode}'
    },

    unauthenticated: {
      message: 'You must be authenticated to execute the request!',
      title: 'Unauthenticated'
    },

    unauthorized: {
      message: 'You don\'t have the necessary rights to access the called route!',
      title: 'Unauthorized'
    }
  },

  footer: {
    legalNotice: 'Legal notice',
    privacyPolicy: 'Privacy policy',
    legalNoticeUrl: 'https://www.thm.de/ges/en/about',
    privacyPolicyUrl: 'https://www.thm.de/ges/en/datenschutz',
    separator: '|'
  },

  roles: {
    admin: 'Administrator',
    user: 'User'
  },

  permissions: {
    rooms: {
      title: 'Rooms',
      create: 'Create rooms',
      delete: 'Delete rooms'
    },

    applicationSettings: {
      title: 'Application',
      update: 'Edit settings',
      viewAny: 'Show all settings'
    },

    settings: {
      title: 'Settings',
      manage: 'Manage settings'
    },

    roles: {
      title: 'Roles',
      create: 'Create roles',
      delete: 'Delete roles',
      update: 'Edit roles',
      view: 'Show roles',
      viewAny: 'Show all roles'
    },

    users: {
      title: 'Users',
      viewAny: 'Show all users',
      view: 'Show users',
      create: 'Create users',
      update: 'Edit users',
      delete: 'Delete users',
      updateOwnAttributes: 'Update own firstname, lastname and email'
    },

    roomTypes: {
      title: 'Room types',
      create: 'Create room types',
      delete: 'Delete room types',
      update: 'Edit room types',
      view: 'Show room types'
    },

    servers: {
      title: 'Servers',
      viewAny: 'Show all servers',
      view: 'Show servers',
      create: 'Create servers',
      update: 'Edit servers',
      delete: 'Delete servers'
    },

    serverPools: {
      title: 'Server pools',
      viewAny: 'Show all server pools',
      view: 'Show server pools',
      create: 'Create server pools',
      update: 'Edit server pools',
      delete: 'Delete server pools'
    }
  },
  overwrite: 'Overwrite',
  save: 'Save',
  back: 'Back',

  nextPage: 'Next page',
  previousPage: 'Previous page',

  confirmPassword: {
    title: 'Confirm password',
    description: 'Please confirm your password before continuing!'
  },

  browse: 'Browse',
  validation: {
    tooLarge: 'The selected file is too large.'
  },

  buttonStyles: {
    primary: 'Primary',
    secondary: 'Secondary',
    success: 'Success',
    danger: 'Danger',
    warning: 'Warning',
    info: 'Info',
    light: 'Light',
    dark: 'Dark',
    link: 'Link'
  },

  linkTargets: {
    blank: 'Open in a new tab',
    self: 'Open in current tab'
  }
};
