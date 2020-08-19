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
      @show="resetInviteModal()"
      @hidden="resetInviteModal()"
    >
      <b-container>
        <b-form @submit.stop.prevent="onSubmit(emails)" id="invite-user-form">
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
                            type="email"
                            :state="errors !== null && errors.email && errors.email.length > 0 ? false: null"
              >
              </b-form-input>
              <b-input-group-append>
                <b-button id="invite-add-email" variant="success" @click="addEmail(inputEmail)">
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
        <b-container fluid>
          <b-row align-h="around">
            <h5>
              <b-badge
                class="mb-2 mr-2 email-badge"
                pill
                variant="success"
                @click="removeEmail(email)"
                v-bind:key="index"
                v-for="(email, index) in emails"
                v-b-tooltip.hover
                :title="$t('settings.users.tooltip.removeEmail')">
                {{ email }}
              </b-badge>
            </h5>
          </b-row>
        </b-container>
        <hr>
        <p class="text-center">{{ $t('settings.users.modal.inviteFooterMessage') }}</p>
        <!--Submit Button-->
        <b-button
          variant="success"
          type="submit"
          form="invite-user-form"
          block>
          {{ $t('settings.users.modal.submit') }}
        </b-button>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
export default {
  data () {
    return {
      inputEmail: '',
      emails: [],
      errors: []
    };
  },
  props: {
    modalId: String
  },
  methods: {
    onSubmit (emails) {
      // TODO Cannot submit if emails array is empty
      // TODO Invite user with email function
      // TODO Show email input validation message when failed e.g. Duplicate Emails, Invalid email input, etc.
      console.log('test submit');
    },
    addEmail (inputEmail) {
      if (this.isValidEmail(inputEmail)) {
        this.emails.push(inputEmail);
        this.inputEmail = '';
        this.errors = [];
      }
    },
    removeEmail (email) {
      this.emails = this.emails.filter(e => e !== email);
    },
    isValidEmail (email) {
      const isEmailDuplicate = this.emails.indexOf(email) > -1;

      const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isEmailValid = regex.test(email);

      return !isEmailDuplicate && isEmailValid;
    },
    resetInviteModal () {
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
</style>
