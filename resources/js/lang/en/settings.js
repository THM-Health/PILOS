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
    }
  }
};
