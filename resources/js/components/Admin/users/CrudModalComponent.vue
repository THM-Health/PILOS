<template>
  <div>
    <!-- CRUD form modal -->
    <b-modal
      :id="modalId"
      :title="modalTitle"
      :static="true"
      header-class="modal-title"
      header-text-variant="success"
      centered
      hide-footer
      @hidden="resetModal()"
    >
      <b-container fluid>
        <b-form @submit.stop.prevent="onSubmit(crudUser)">
          <div id="user-delete" v-if="modalType === 'delete'">
            <p>{{ $t('settings.users.modal.deleteContent') }}</p>
          </div>
          <div id="user-create-update" v-if="modalType === 'create' || modalType === 'update'">
            <b-form-group id="crud-email"
                          label-for="crud-input-email">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.email')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="envelope"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-email"
                              v-model="crudUser.email"
                              :placeholder="$t('settings.users.fields.email')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.email && errors.email.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.email && errors.email.length > 0 ? false: null">
                <template v-for="error in errors.email">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-username"
                          label-for="crud-input-username">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.username')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="person-circle"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-username"
                              v-model="crudUser.username"
                              :placeholder="$t('settings.users.fields.username')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.username && errors.username.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.username && errors.username.length > 0 ? false: null">
                <template v-for="error in errors.username">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-password"
                          label-for="crud-input-password"
                          v-if="modalType !== 'update'">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.password')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="shield-lock"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-password"
                              v-model="crudUser.password"
                              :placeholder="$t('settings.users.fields.password')"
                              type="password"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.password && errors.password.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.password && errors.password.length > 0 ? false: null">
                <template v-for="error in errors.password">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-password-confirmation"
                          label-for="crud-input-password-confirmation"
                          v-if="modalType !== 'update'">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.passwordConfirmation')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="shield-lock-fill"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-password-confirmation"
                              v-model="crudUser.password_confirmation"
                              :placeholder="$t('settings.users.fields.passwordConfirmation')"
                              type="password"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.password_confirmation && errors.password_confirmation.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.password_confirmation && errors.password_confirmation.length > 0 ? false: null">
                <template v-for="error in errors.password_confirmation">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-firstname"
                          label-for="crud-input-firstname">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.firstname')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="tag"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-firstname"
                              v-model="crudUser.firstname"
                              :placeholder="$t('settings.users.fields.firstname')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.firstname && errors.firstname.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.firstname && errors.firstname.length > 0 ? false: null">
                <template v-for="error in errors.firstname">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group id="crud-lastname"
                          label-for="crud-input-lastname">
              <b-input-group>
                <b-input-group-prepend v-b-tooltip.hover :title="$t('settings.users.fields.lastname')">
                  <b-input-group-text class="bg-success text-white">
                    <b-icon icon="tag-fill"></b-icon>
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input id="crud-input-lastname"
                              v-model="crudUser.lastname"
                              :placeholder="$t('settings.users.fields.lastname')"
                              required
                              :disabled="isBusy"
                              :state="errors !== null && errors.lastname && errors.lastname.length > 0 ? false: null">
                </b-form-input>
              </b-input-group>
              <b-form-invalid-feedback
                :state="errors !== null && errors.lastname && errors.lastname.length > 0 ? false: null">
                <template v-for="error in errors.lastname">
                  {{ error }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
          </div>

          <b-button
            id="crud-user-submit"
            class="mt-3"
            block
            type="submit"
            variant="success"
            :disabled="isBusy">
            {{ $t('settings.users.modal.submit') }}
          </b-button>

        </b-form>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';

export default {
  data () {
    return {
      isBusy: false,
      errors: []
    };
  },
  props: {
    crudUser: Object,
    modalId: String,
    modalType: { type: String, validator: (val) => ['create', 'update', 'delete'].includes(val) }
  },
  methods: {
    onSubmit (user) {
      (this.modalType === 'create') ? this.createUser(user)
        : (this.modalType === 'update') ? this.updateUser(user.id, user)
          : this.deleteUser(user.id);
    },
    createUser (user) {
      this.isBusy = true;

      Base.call('users', {
        headers: {
          'content-type': 'application/json'
        },
        method: 'post',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          password: user.password,
          password_confirmation: user.password_confirmation,
          email: user.email,
          username: user.username
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.createSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch((error) => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.createFailed'));

        throw error;
      }).finally(() => {
        this.$emit('crud');
        this.isBusy = false;
      });
    },
    updateUser (id, user) {
      this.isBusy = true;

      Base.call('users/' + id, {
        headers: {
          'content-type': 'application/json'
        },
        method: 'put',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          username: user.username
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.editSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch(error => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.editFailed'));

        throw error;
      }).finally(() => {
        this.$emit('crud');
        this.isBusy = false;
      });
    },
    deleteUser (id) {
      this.isBusy = true;

      Base.call('users/' + id, {
        method: 'delete'
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.deleteSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch((error) => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.deleteFailed'));

        throw error;
      }).finally(() => {
        this.$emit('crud');
        this.isBusy = false;
      });
    },
    resetModal () {
      this.crudUser.id = null;
      this.crudUser.firstname = null;
      this.crudUser.lastname = null;
      this.crudUser.email = null;
      this.crudUser.password = null;
      this.crudUser.password_confirmation = null;
      this.crudUser.username = null;
      this.crudUser.guid = null;
      this.crudUser.authenticator = null;

      this.errors = [];
    }
  },
  computed: {
    modalTitle () {
      return (this.modalType === 'create') ? this.$t('settings.users.modal.create')
        : (this.modalType === 'update') ? this.$t('settings.users.modal.update')
          : this.$t('settings.users.modal.delete');
    }
  }
};
</script>

<style scoped>
</style>
