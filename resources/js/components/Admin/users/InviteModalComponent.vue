<template>
  <div>
    <!-- Invite Modal -->
    <b-modal
      :id="modalId"
      :title="$t('settings.users.modal.invite')"
      :static="true"
      header-text-variant="success"
      centered
      hide-footer
      @show="resetInviteModal"
      @hidden="resetInviteModal"
    >
      <b-container>
        <b-form @submit.stop.prevent="inviteUsers" id="invite-user-form">
          <b-form-group id="invite-email"
                        label-for="invite-input-email">
            <b-input-group>
              <b-input-group-prepend>
                <b-input-group-text class="bg-success text-white"><i class="fa fas fa-mail-bulk"></i>
                </b-input-group-text>
              </b-input-group-prepend>
              <b-form-input id="invite-input-email"
                            v-model="inputEmail"
                            :placeholder="$t('settings.users.modal.invitePlaceholder')"
                            @keydown.enter.prevent="addEmail(inputEmail)"
                            :disabled="isBusy"
                            type="email"
                            :state="errors !== null && errors.email && errors.email.length > 0 ? false: null"
              >
              </b-form-input>
              <b-input-group-append>
                <b-button id="invite-add-email-button" variant="success" @click="addEmail(inputEmail)">
                  <i class="fa fas fa-plus-circle"></i>
                </b-button>
              </b-input-group-append>
            </b-input-group>
            <b-form-invalid-feedback
              :state="errors !== null && errors.email && errors.email.length > 0 ? false: null">
              <template v-for="error in errors.email">
                {{ error }}
              </template>
            </b-form-invalid-feedback>
          </b-form-group>
        </b-form>
        <hr>
        <b-container ref="invite-email-badge-container" fluid>
          <b-row align-h="around" class="h5">
            <transition-group name="list" tag="span">
              <span v-for="email in emails" v-bind:key="email" class="list-email">
                <b-badge
                  class="mb-2 mr-2 email-badge"
                  pill
                  variant="success"
                  @click="removeEmail(email)"
                  v-b-tooltip.hover
                  :title="$t('settings.users.tooltip.removeEmail')">
                  {{ email }}
                </b-badge>
              </span>
            </transition-group>
          </b-row>
        </b-container>
        <hr>
        <p class="text-center">{{ $t('settings.users.modal.inviteFooterMessage') }}</p>
        <!--Submit Button-->
        <b-button
          id="invite-submit-button"
          variant="success"
          type="submit"
          form="invite-user-form"
          :disabled="isBusy || emails.length <= 0"
          block>
          {{ $t('settings.users.modal.submit') }}
        </b-button>
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
      inputEmail: '',
      emails: [],
      errors: []
    };
  },
  props: {
    modalId: String
  },
  methods: {
    addEmail (inputEmail) {
      if (this.isValidEmail(inputEmail)) {
        this.emails.push(inputEmail);
        this.inputEmail = '';
        this.errors = [];
      } else {
        this.errors = { email: [this.$t('settings.users.modal.inviteEmailError')] };
      }
    },
    removeEmail (email) {
      this.emails = this.emails.filter(e => e !== email);
    },
    inviteUsers () {
      this.isBusy = true;

      Base.call('invitations', {
        headers: {
          'content-type': 'application/json'
        },
        method: 'post',
        data: {
          email: this.emails
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.inviteSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];
      }).catch((error) => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.inviteFailed'));

        this.emails = [];

        throw error;
      }).finally(() => {
        this.isBusy = false;
      });
    },
    isValidEmail (email) {
      const isEmailDuplicate = this.emails.indexOf(email) > -1;

      const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isEmailValid = regex.test(email);

      return !isEmailDuplicate && isEmailValid;
    },
    resetInviteModal () {
      this.isBusy = false;
      this.inputEmail = '';
      this.emails = [];
      this.errors = [];
    }
  }
};

</script>

<style scoped>
.email-badge {
  color: white;
}

.list-email {
  display: inline-block;
  margin-right: 10px;
}

.list-enter-active, .list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
