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
    preview: 'Preview',

    numberOptions: {
      one: '1',
      five: '5',
      ten: '10',
      fifteen: '15',
      thirty: '30',
      fifty: '50',
      unlimited: 'Unlimited'
    },

    updateSettingsSuccess: {
      message: 'Settings updated successfully!',
      title: 'Settings'
    },

    logo: {
      title: 'Logo',
      description: 'Change the application logo. Enter the image URL',
      hint: 'Image URL'
    },

    roomLimit: {
      title: 'Number of rooms per user',
      description: 'Limits the number of rooms that a user can have. This setting does not apply to administrators'
    },

    paginationPageSize: {
      title: 'Pagination page size',
      description: 'Limits the number of page size for data tables pagination'
    },

    ownRoomsPaginationPageSize: {
      title: 'Own rooms pagination page size',
      description: 'Limits the number of page size for own rooms pagination'
    }
  }
};
