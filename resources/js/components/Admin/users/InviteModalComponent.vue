<template>
  <div>
    <!-- Invite Modal -->
    <b-modal
      :id="modalId"
      :title="$t('settings.users.inviteModal.title')"
      header-bg-variant="success"
      header-text-variant="light"
      ok-variant="success"
      ok-only
      centered
      @show="resetInviteModal()"
      @hidden="resetInviteModal()"
    >
      <b-container>
        <!--TODO Email Input Form-->
      </b-container>
    </b-modal>
  </div>
</template>

<script>
export default {
  data () {
    return {
      inputEmail: null,
      userEmails: []
    };
  },
  props: {
    modalId: String
  },
  methods: { // TODO Invite User Function
    resetInviteModal () {
      this.inputEmail = null;
      this.userEmails = null;
    }
  }
};

</script>

<style scoped>

</style>
