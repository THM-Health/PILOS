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
      custom: 'Custom amount'
    },
    default: 'Default',
    actions: 'Actions',
    nodata: 'No roles found!',

    noOptions: 'No permissions found!',

    delete: {
      item: 'Delete role {id}',
      confirm: 'Are you really want to delete the role {name}?',
      title: 'Delete role?'
    }
  },

  users: {
    title: 'Users'
  },

  application: {
    title: 'Application',
    save: 'Save',

    brandImage: {
      title: 'Brand image',
      description: 'Here you can change the brand image that appears in the upper left corner.'
    },

    themeColor: {
      title: 'Theme Color',
      regularTitle: 'Regular',
      lightenTitle: 'Lighten',
      darkenTitle: 'Darken',
      description: 'Here you can change the theme color.'
    },

    registrationMethod: {
      title: 'Registration method',
      open: 'Open Registration',
      invitation: 'Join by Invitation',
      description: 'Here you can change the registration method.'
    },

    roomAuthentication: {
      title: 'Room authentication',
      enabled: 'Enabled',
      disabled: 'Disabled',
      description: 'Only allow authenticated users to join a room.'
    },

    roomShare: {
      title: 'Allow Users to Share Rooms',
      enabled: 'Enabled',
      disabled: 'Disabled',
      description: 'Setting to disabled will remove the button from the Room options dropdown, preventing users from sharing rooms.'
    },

    recordingVisibility: {
      title: 'Recording Default Visibility',
      public: 'public',
      unlisted: 'unlisted',
      description: 'Set the default recording visbility for new recordings.'
    },

    roomsPerUser: {
      title: 'Number of rooms per user',
      description: 'Limits the number of rooms that a user can have. This setting does not apply to administrators.',
      option: {
        one: '1',
        five: '5',
        ten: '10',
        unlimited: 'Unlimited'
      }
    }
  }
};
