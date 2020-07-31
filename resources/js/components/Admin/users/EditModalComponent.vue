<template>
  <div>
    <b-modal
      id="edit-modal"
      :title="$t('settings.users.editModal.title')"
      header-bg-variant="success"
      header-text-variant="light"
      centered
      hide-footer
      @hidden="resetEditedUser"
    >
      <b-container fluid>
        <!-- TODO Input Validation -->
        <b-form @submit.stop.prevent="editUser(editedUser.id, editedUser)">
          <b-form-group id="edit-firstname" :label="$t('settings.users.editModal.firstname')"
                        label-for="edit-input-firstname">
            <b-form-input id="edit-input-firstname"
                          v-model="editedUser.firstname"
                          :placeholder="$t('settings.users.editModal.firstname')"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="edit-lastname" :label="$t('settings.users.editModal.lastname')"
                        label-for="edit-input-lastname">
            <b-form-input id="edit-input-lastname"
                          v-model="editedUser.lastname"
                          :placeholder="$t('settings.users.editModal.lastname')"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="edit-email" :label="$t('settings.users.editModal.email')" label-for="edit-input-email">
            <b-form-input id="edit-input-email"
                          v-model="editedUser.email"
                          :placeholder="$t('settings.users.editModal.email')"
                          required>
            </b-form-input>
          </b-form-group>

          <b-container class="d-flex justify-content-end">
            <b-button @click="$bvModal.hide('edit-modal')" type="submit" variant="success">
              {{$t('settings.users.editModal.submit')}}
            </b-button>
          </b-container>
        </b-form>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';

export default {
  data () {
    return {};
  },
  props: {
    editedUser: Object
  },
  methods: {
    editUser (id, user) {
      Base.call('users/' + id, {
        headers: {
          'content-type': 'application/json'
        },
        method: 'put',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.editSuccess'));
      }).catch(error => {
        console.log(error);
        this.flashMessage.error(this.$t('settings.users.editFailed'));
      }).finally(() => this.getUsers(this.currentPage));
    },
    resetEditedUser () {
      this.editedUser.id = null;
      this.editedUser.firstname = null;
      this.editedUser.lastname = null;
      this.editedUser.username = null;
      this.editedUser.email = null;
      this.editedUser.password = null;
    }
  }
};
</script>

<style scoped>

</style>
