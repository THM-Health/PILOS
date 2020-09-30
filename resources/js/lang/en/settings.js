export default {
  title: 'Settings',
  description: 'Here you can manage the settings of the application.<br>' +
    'Please select one of the menu items on the left to adjust the settings.',

  roles: {
    title: 'Roles',

    new: 'Create new role',
    view: 'Detailed information for {name}',
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
      confirm: 'Are you really want to delete the role {name}?',
      title: 'Delete role?'
    }
  },

  users: {
    title: 'Users',
    titleDatabaseCard: 'Database Information',
    tooltip: {
      create: 'Create an user.',
      invite: 'Invite an user.',
      removeEmail: 'click to remove'
    },
    fields: {
      id: 'User ID',
      authenticator: 'Authenticator',
      email: 'Email',
      name: 'Name',
      firstname: 'Firstname',
      lastname: 'Lastname',
      username: 'Username',
      guid: 'GUID',
      created: 'Created',
      updated: 'Updated',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      details: 'Details',
      password: 'Password',
      passwordConfirmation: 'Password confirmation'
    },
    modal: {
      create: 'Create User',
      update: 'Update User',
      delete: 'Delete Confirmation',
      deleteContent: 'Are you sure? This action cannot be undone!',
      invite: 'Invite User',
      invitePlaceholder: 'Email address of a user',
      inviteButton: 'Send invitation email',
      inviteFooterMessage: 'The user will receive an email with instructions on how to register',
      inviteEmailError: 'Wrong email format and duplicate are not allowed!',
      submit: 'Submit'
    },
    createSuccess: {
      message: 'User created successfully!',
      title: 'Create'
    },
    createFailed: {
      message: 'Something went wrong! Please check your connection!',
      title: 'Create'
    },
    deleteSuccess: {
      message: 'User deleted successfully!',
      title: 'Delete'
    },
    deleteFailed: {
      message: 'Something went wrong! Please check your connection!',
      title: 'Delete'
    },
    editSuccess: {
      message: 'User edited successfully',
      title: 'Edit'
    },
    editFailed: {
      message: 'Something went wrong! Please check your connection!',
      title: 'Edit'
    },
    inviteSuccess: {
      message: 'Invitation sent successfully!',
      title: 'Invitation'
    },
    inviteFailed: {
      message: 'Something went wrong! Please check your connection!',
      title: 'Invitation'
    }
  },
};
