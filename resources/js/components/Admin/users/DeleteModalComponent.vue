<template>
  <div>
    <!-- Delete confirm modal -->
    <b-modal
      id="delete-modal"
      :title="$t('settings.users.deleteModal.title')"
      header-bg-variant="success"
      header-text-variant="light"
      ok-variant="success"
      ok-only
      centered
      @hidden="resetDeletedUser"
      @ok="deleteUser(deletedUser.id)"
    >
      {{ $t('settings.users.deleteModal.content') }}
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
    deletedUser: Object
  },
  methods: {
    deleteUser (id) {
      Base.call('users/' + id, {
        method: 'delete'
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.deleteSuccess'));
      }).catch(error => {
        console.log(error);
        this.flashMessage.error(this.$t('settings.users.deleteFailed'));
      }).finally(() => this.getUsers(this.currentPage));
    },
    resetDeletedUser () {
      this.deletedUser.id = null;
      this.deletedUser.firstname = null;
      this.deletedUser.lastname = null;
      this.deletedUser.username = null;
      this.deletedUser.email = null;
      this.deletedUser.password = null;
    }
  }
};
</script>

<style scoped>

</style>
