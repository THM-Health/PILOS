<template>
  <div>
    <!-- Create form modal -->
    <b-modal
      id="create-modal"
      :title="$t('settings.users.createModal.title')"
      header-bg-variant="success"
      header-text-variant="light"
      centered
      hide-footer
      @hidden="resetCreatedUser"
    >
      <b-container fluid>
        <!-- TODO Input Validation -->
        <b-form @submit.stop.prevent="createUser(createdUser)">
          <b-form-group id="create-email" :label="$t('settings.users.createModal.email')"
                        label-for="create-input-email">
            <b-form-input id="create-input-email"
                          v-model="createdUser.email"
                          :placeholder="$t('settings.users.createModal.email')"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="create-username" :label="$t('settings.users.createModal.username')"
                        label-for="create-input-username">
            <b-form-input id="create-input-username"
                          v-model="createdUser.username"
                          :placeholder="$t('settings.users.createModal.username')"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="create-password" :label="$t('settings.users.createModal.password')"
                        label-for="create-input-password">
            <b-form-input id="create-input-password"
                          v-model="createdUser.password"
                          :placeholder="$t('settings.users.createModal.password')"
                          type="password"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="create-firstname" :label="$t('settings.users.createModal.firstname')"
                        label-for="create-input-firstname">
            <b-form-input id="create-input-firstname"
                          v-model="createdUser.firstname"
                          :placeholder="$t('settings.users.createModal.firstname')"
                          required>
            </b-form-input>
          </b-form-group>
          <b-form-group id="create-lastname" :label="$t('settings.users.createModal.lastname')"
                        label-for="create-input-lastname">
            <b-form-input id="create-input-lastname"
                          v-model="createdUser.lastname"
                          :placeholder="$t('settings.users.createModal.lastname')"
                          required>
            </b-form-input>
          </b-form-group>

          <b-container class="d-flex justify-content-end">
            <b-button @click="$bvModal.hide('create-modal')" type="submit" variant="success">
              {{$t('settings.users.createModal.submit')}}
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
    createdUser: Object
  },
  methods: {
    createUser (user) {
      Base.call('users', {
        headers: {
          'content-type': 'application/json'
        },
        method: 'post',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          password: user.password,
          email: user.email,
          username: user.username
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.createSuccess'));
      }).catch(error => {
        console.log(error);
        this.flashMessage.error(this.$t('settings.users.createFailed'));
      }).finally(() => this.getUsers(this.currentPage));
    },
    resetCreatedUser () {
      this.createdUser.id = null;
      this.createdUser.firstname = null;
      this.createdUser.lastname = null;
      this.createdUser.username = null;
      this.createdUser.email = null;
      this.createdUser.password = null;
    }
  }
};
</script>

<style scoped>

</style>
