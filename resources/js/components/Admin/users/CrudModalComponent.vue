<template>
  <div>
    <!-- Create form modal -->
    <b-modal
      :id="modalId"
      :title="modalTitle"
      header-bg-variant="success"
      header-text-variant="light"
      centered
      hide-footer
      @hidden="resetUser()"
    >
      <b-container fluid>
        <!-- TODO Input Validation -->
        <b-form @submit.stop.prevent="onSubmit(crudUser)">
          <div v-if="modalType === 'delete'">
            {{ $t('settings.users.modal.deleteContent') }}
          </div>
          <div v-if="modalType === 'create' || modalType === 'update'">
            <b-form-group id="crud-email" :label="$t('settings.users.fields.email')"
                          label-for="crud-input-email">
              <b-form-input id="crud-input-email"
                            v-model="crudUser.email"
                            :placeholder="$t('settings.users.fields.email')"
                            required>
              </b-form-input>
            </b-form-group>
            <b-form-group id="crud-username" :label="$t('settings.users.fields.username')"
                          label-for="crud-input-username">
              <b-form-input id="crud-input-username"
                            v-model="crudUser.username"
                            :placeholder="$t('settings.users.fields.username')"
                            required>
              </b-form-input>
            </b-form-group>
            <b-form-group id="crud-password" :label="$t('settings.users.fields.password')"
                          label-for="crud-input-password" v-if="modalType !== 'update'">
              <b-form-input id="crud-input-password"
                            v-model="crudUser.password"
                            :placeholder="$t('settings.users.fields.password')"
                            type="password"
                            required>
              </b-form-input>
            </b-form-group>
            <b-form-group id="crud-firstname" :label="$t('settings.users.fields.firstname')"
                          label-for="crud-input-firstname">
              <b-form-input id="crud-input-firstname"
                            v-model="crudUser.firstname"
                            :placeholder="$t('settings.users.fields.firstname')"
                            required>
              </b-form-input>
            </b-form-group>
            <b-form-group id="crud-lastname" :label="$t('settings.users.fields.lastname')"
                          label-for="crud-input-lastname">
              <b-form-input id="crud-input-lastname"
                            v-model="crudUser.lastname"
                            :placeholder="$t('settings.users.fields.lastname')"
                            required>
              </b-form-input>
            </b-form-group>
          </div>
          <b-container class="d-flex justify-content-end">
            <b-button type="submit" variant="success">
              {{ $t('settings.users.modal.submit') }}
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
    crudUser: Object,
    modalId: String,
    modalType: { type: String, validator: (val) => ['create', 'update', 'delete'].includes(val) }
  },
  methods: {
    onSubmit (user) {
      (this.modalType === 'create') ? this.createUser(user)
        : (this.modalType === 'update') ? this.updateUser(user.id, user)
          : this.deleteUser(user.id);

      this.$bvModal.hide('crud-modal');
    },
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
      }).finally(() => {
        this.$emit('crud');
      });
    },
    updateUser (id, user) {
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
      }).catch(error => {
        console.log(error);
        this.flashMessage.error(this.$t('settings.users.editFailed'));
      }).finally(() => {
        this.$emit('crud');
      });
    },
    deleteUser (id) {
      Base.call('users/' + id, {
        method: 'delete'
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.deleteSuccess'));
      }).catch(error => {
        console.log(error);
        this.flashMessage.error(this.$t('settings.users.deleteFailed'));
      }).finally(() => {
        this.$emit('crud');
      });
    },
    resetUser () {
      this.crudUser.id = null;
      this.crudUser.firstname = null;
      this.crudUser.lastname = null;
      this.crudUser.email = null;
      this.crudUser.password = null;
      this.crudUser.username = null;
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
