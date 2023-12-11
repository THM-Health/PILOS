<template>
    <!-- Add list of users from database -->
    <b-button
      variant="success"
      ref="bulk-import-members-button"
      @click="showModal"
    >
      <i class="fa-solid fa-user-plus"></i> {{ $t('rooms.members.bulk_import_users') }}
    </b-button>

    <!-- bulk add new user modal -->
    <b-modal
      :static='modalStatic'
      :no-close-on-backdrop="true"
      hide-footer
      class="pb-0"
      ref="bulk-import-modal"
      id="bulk-import-modal"
      :busy="loading"
      :no-close-on-esc="loading"
      :hide-header-close="loading"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.bulk_import_users') }}
      </template>

      <div v-if="step === 0">
      <b-form-group
        :state="fieldState('user_emails')"
        :description="$t('rooms.members.modals.bulk_import.list_description')"
        :label="$t('rooms.members.modals.bulk_import.label')"
      >
        <b-form-textarea
          :state="fieldState('user_emails')"
          v-model="rawList"
          :placeholder="$t('rooms.members.modals.bulk_import.list_placeholder')"
          :disabled="loading"

        rows = "8"
      ></b-form-textarea>
          <template #invalid-feedback><div v-html="fieldError('user_emails')"></div>
        </template>
      </b-form-group>

        <b-form-group :label="$t('rooms.role')" :state="fieldState('role')" >
          <b-form-radio :state="fieldState('role')" :disabled="loading" v-model.number="newUsersRole" name="some-radios" :value="1">
            <b-badge class="text-white" variant="success">{{ $t('rooms.roles.participant') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" :disabled="loading" v-model.number="newUsersRole" name="some-radios" :value="2">
            <b-badge variant="danger">{{ $t('rooms.roles.moderator') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" :disabled="loading" v-model.number="newUsersRole" name="some-radios" :value="3">
            <b-badge variant="dark">{{ $t('rooms.roles.co_owner') }}</b-badge>
          </b-form-radio>
          <template #invalid-feedback><div v-html="fieldError('role')"></div> </template>
        </b-form-group>

        <div class="modal-footer">
          <b-button :disabled='rawList.length === 0 || loading' @click="importUsers(true)" variant="success">
            <b-spinner label="Loading..." small v-if="loading"></b-spinner>
            {{$t('rooms.members.modals.add.add')}}</b-button>
        </div>
      </div>

      <div v-if="step === 1">

        <bulk-import-members-list-component :list="validUsers" variant="success" :description="$t('rooms.members.modals.bulk_import.can_import_users')"/>

        <bulk-import-members-list-component :list="invalidUsers" variant="danger" :description="$t('rooms.members.modals.bulk_import.cannot_import_users')"/>

        <i v-if="validUsers.length>0">
          {{$t('rooms.members.modals.bulk_import.import_importable_question')}}</i>
        <br>
        <div class="modal-footer">
          <b-button @click="step = 0" :disabled="loading" variant="dark">{{$t('app.back')}}</b-button>
          <b-button @click="importUsers(false)" :disabled="loading" variant="success" v-if="validUsers.length > 0">
            <b-spinner label="Loading..." small v-if="loading"></b-spinner>
            {{$t('rooms.members.modals.bulk_import.import_importable_button')}}</b-button>
        </div>
      </div>
      <div v-if="step === 2">

        <bulk-import-members-list-component :list="validUsers" variant="success" :description="$t('rooms.members.modals.bulk_import.imported_users')"/>

        <bulk-import-members-list-component :list="invalidUsers" variant="danger" :description="$t('rooms.members.modals.bulk_import.could_not_import_users')"/>

        <div class="modal-footer">
          <b-button variant="success" @click="finish">{{ $t('app.close') }}</b-button>
          <b-button v-if="invalidUsers.length>0" @click="copyInvalidUsers">{{$t('rooms.members.modals.bulk_import.copy_and_close')}}</b-button>
        </div>
      </div>
    </b-modal>
</template>

<script>

import _ from 'lodash';
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';
import BulkImportMembersListComponent from './BulkImportMembersListComponent.vue';

export default {
  components: { BulkImportMembersListComponent },
  mixins: [FieldErrors],
  name: 'BulkImportMembersComponent',

  props: {
    roomId: {
      type: String,
      required: true
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      step: 0,
      rawList: '',
      newUsersRole: 1,

      validUsers: [],
      invalidUsers: [],
      errors: [],
      loading: false

    };
  },
  computed: {

  },

  methods: {

    /**
     * show modal to bulk import users
     */
    showModal () {
      this.step = 0;
      this.rawList = '';
      this.errors = [];
      this.$bvModal.show('bulk-import-modal');
    },

    /**
     * close modal to bulk import users
     */
    finish () {
      this.$bvModal.hide('bulk-import-modal');
    },

    /**
     * copy the invalid users and close the modal to bulk import users
     */
    copyInvalidUsers () {
      const invalidUsersEmails = this.invalidUsers.map(invalidUser => invalidUser.email);
      navigator.clipboard.writeText(invalidUsersEmails.join('\n'));
      this.toastInfo(this.$t('rooms.members.modals.bulk_import.copied_invalid_users'));
      this.finish();
    },

    /**
     * init the valid users with the emails that were entered by the user
     */
    initValidUsers () {
      // get content from the textarea and remove unnecessary characters (' ', '\t', '\n' except the separator)
      const transferList = this.rawList
        .replaceAll(' ', '')
        .replaceAll('\t', '')
        .replaceAll(/^[\n?\r]+/gm, '')
        .toLowerCase();
      const usersEmailList = _.uniq(transferList.split(/\r?\n/));
      // delete last element of the email list if it is empty
      if (usersEmailList.at(usersEmailList.length - 1) === '') {
        usersEmailList.splice(usersEmailList.length - 1, 1);
      }
      // clear valid users and add the emails that were entered by the user
      this.validUsers = [];
      usersEmailList.forEach(email => {
        this.validUsers.push({ email, error: null });
      });
      // clear invalid users
      this.invalidUsers = [];
    },
    /**
     * bulk import users
     * @param firstRound
     */
    importUsers (firstRound = false) {
      this.errors = [];
      // initialize list of valid and invalid users on first request sent to the server
      // all subsequent requests only modify list of valid/invalid users
      if (firstRound) { this.initValidUsers(); }
      const userEmails = this.validUsers.map(entry => entry.email);
      this.loading = true;

      // post new users as room members
      Base.call('rooms/' + this.roomId + '/member/bulk', {
        method: 'post',
        data: { user_emails: userEmails, role: this.newUsersRole }
      }).then(response => {
        // operation successful, go to the last step and emit "imported" to reload member list
        this.step = 2;
        this.$emit('imported');
      }).catch(error => {
        // adding failed
        if (error.response) {
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            // check for role errors
            if (error.response.data.errors.role) {
              this.errors = { role: error.response.data.errors.role };

              return;
            }
            // check for general errors with user list (empty, too long)
            if (error.response.data.errors.user_emails) {
              this.errors = { user_emails: error.response.data.errors.user_emails };

              return;
            }

            // check for errors for the single emails
            const regex = /^user_emails\.([0-9]+)$/;
            Object.keys(error.response.data.errors).forEach(errorKey => {
              const result = errorKey.match(regex);
              const index = result[1];
              // userEmails contains the array send to the server,
              // by using the index of the error the server returned, the email causing the error can be looked up
              const email = userEmails[index];
              // remove email from the list of valid emails
              this.validUsers = this.validUsers.filter(entry => entry.email !== email);
              // get error message for this email
              const errorString = error.response.data.errors[errorKey][0];
              // add email to the list of invalid emails
              this.invalidUsers.push({ email, error: errorString });
              this.step = 1;
            });
            return;
          }
        }
        Base.error(error, this.$root);
      }).finally(() => {
        this.loading = false;
      });
    }
  }

};
</script>
