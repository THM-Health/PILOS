<template>
  <div v-frag>
    <!-- Add list of users from database -->
    <b-button
      variant="success"
      ref="add-member"
      @click="showModal"
    >
      <i class="fa-solid fa-user-plus"></i> {{ $t('rooms.members.bulk_add_user') }}
    </b-button>

    <!-- bulk add new user modal -->
    <b-modal
      :no-close-on-backdrop="true"
      hide-footer
      class="pb-0"
      ref="bulk-import-modal"
      id="bulk-import-modal"
    >
      <template v-slot:modal-title>
        {{ $t('rooms.members.bulk_add_user') }}
      </template>

      <div v-if="step === 0">
      <b-form-group
        :state="fieldState('user_emails')"
        :description="$t('rooms.members.modals.add.information_bulk')"
        :label="$t('rooms.members.modals.add.description_bulk')"
      >
        <b-form-textarea
          :state="fieldState('user_emails')"
          v-model="rawList"
         :placeholder="$t('rooms.members.modals.add.textarea.description_bulk')"

        rows = "8"
      ></b-form-textarea>
          <template slot='invalid-feedback'><div v-html="fieldError('user_emails')"></div>
        </template>
      </b-form-group>


        <b-form-group :label="$t('rooms.role')"  >
          <b-form-radio :state="fieldState('role')" v-model.number="newUsersRole" name="some-radios" value="1">
            <b-badge class="text-white" variant="success">{{ $t('rooms.roles.participant') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" v-model.number="newUsersRole" name="some-radios" value="2">
            <b-badge variant="danger">{{ $t('rooms.roles.moderator') }}</b-badge>
          </b-form-radio>
          <b-form-radio :state="fieldState('role')" v-model.number="newUsersRole" name="some-radios" value="3">
            <b-badge variant="dark">{{ $t('rooms.roles.co_owner') }}</b-badge>
          </b-form-radio>
        </b-form-group>

        <div class="modal-footer">
          <b-button :disabled='rawList.length === 0' @click="importUsers(true)" variant="success">{{$t('rooms.members.modals.add.add')}}</b-button>
        </div>
      </div>

      <div v-if="step === 1">

        <bulk-import-members-list-component :list="validUsers" variant="success" :description="$t('rooms.members.modals.bulk_import.can_import_users')"/>

        <bulk-import-members-list-component :list="invalidUsers" variant="danger" :description="$t('rooms.members.modals.bulk_import.cannot_import_users')"/>

        <i v-if="validUsers.length>0">
          {{$t('rooms.members.modals.bulk_import.import_importable_question')}}</i>
        <br>
        <div class="modal-footer">
          <b-button @click="step = 0" variant="dark">{{$t('app.back')}}</b-button>
          <b-button @click="importUsers(false)" variant="success" v-if="validUsers.length > 0">{{$t('app.next')}}</b-button>
        </div>
      </div>
      <div v-if="step === 2">

        <bulk-import-members-list-component :list="validUsers" variant="success" :description="$t('rooms.members.modals.bulk_import.imported_users')"/>

        <bulk-import-members-list-component :list="invalidUsers" variant="danger" :description="$t('rooms.members.modals.bulk_import.could_not_import_users')"/>

        <div class="modal-footer">
          <b-button variant="success" @click="finish">{{ $t('app.close') }}</b-button>
          <b-button @click="copyInvalidUsers">{{$t('rooms.members.modals.bulk_import.copy_and_close')}}</b-button>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>

import _ from 'lodash';
import frag from 'vue-frag';
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
    }
  },

  directives: {
    frag
  },

  data () {
    return {
      step: 0,
      rawList: '',
      newUsersRole: 1,

      validUsers: [],
      invalidUsers: [],
      errors: []

    };
  },
  computed: {

  },

  methods: {
    showModal () {
      this.step = 0;
      this.rawList = '';
      this.errors = [];
      this.$bvModal.show('bulk-import-modal');
    },
    finish () {
      this.$bvModal.hide('bulk-import-modal');
    },
    copyInvalidUsers () { // OK?
      const invalidUsersEmails = this.invalidUsers.map(invalidUser => invalidUser.email);
      navigator.clipboard.writeText(invalidUsersEmails.join('\n'));
      this.toastInfo(this.$t('rooms.members.modals.bulk_import.copied_invalid_users'));
      this.finish();
    },

    initValidUsers () {
      const transferList = this.rawList
        .replaceAll(' ', '')
        .replaceAll('\t', '')
        .replaceAll(/^[\n?\r]+/gm, '')
        ;//.toLowerCase(); //ToDo only commented for test purposes
      const usersEmailList = _.uniq(transferList.split(/\r?\n/));
      if (usersEmailList.at(usersEmailList.length - 1) === '') {
        usersEmailList.splice(usersEmailList.length - 1, 1);
      }
      this.validUsers = [];
      usersEmailList.forEach(email => {
        this.validUsers.push({ email, error: null });
      });

      this.invalidUsers = [];
    },

    importUsers (firstRound = false) {
      this.errors =[];
      if (firstRound) { this.initValidUsers(); }

      const userEmails = this.validUsers.map(entry => entry.email);

      Base.call('rooms/' + this.roomId + '/member/bulk', {
        method: 'post',
        data: { user_emails: userEmails, role: this.newUsersRole }
      }).then(response => {
        this.step = 2;
        this.$emit('imported');
      }).catch(error => {
        if (error.response) {
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            if (error.response.data.errors.user_emails) {
              this.errors = {user_emails : error.response.data.errors.user_emails};

              return;
            }

            const regex = /^user_emails\.([0-9]+)$/;
            Object.keys(error.response.data.errors).forEach(errorKey => {
              const result = errorKey.match(regex);
              if (result == null) {
                return;
              }
              const index = result[1];
              console.log('Invalid email: ' + userEmails[index]);

              this.validUsers = this.validUsers.filter(entry => entry.email !== userEmails[index]);
              const errorString = error.response.data.errors[errorKey][0];
              this.invalidUsers.push({ email: userEmails[index], error: errorString });
              this.step = 1;
            });
          }
        }
      });
    }
  }

};
</script>

<style scoped>

.preview {
  max-height: 200px;
  overflow-y: scroll;
}
</style>
