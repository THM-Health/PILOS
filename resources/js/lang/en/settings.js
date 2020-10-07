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
    nodata: 'No roles found!',

    noOptions: 'No permissions found!',

    delete: {
      item: 'Delete role {id}',
      confirm: 'Are you really want to delete the role {name}?',
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

    id: 'ID',
    firstname: 'Firstname',
    lastname: 'Lastname',
    email: 'E-Mail',
    username: 'Username',
    password: 'Password',
    password_confirmation: 'Password confirmation',
    user_locale: 'Language',
    roles: 'Roles',
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
  }
};
