<template>
  <b-container class="mt-3 mb-5">
    <b-card class="p-3 border bg-white">
      <h3>
        {{ $t('app.profile') }}
      </h3>
      <hr>

      <view-edit-component :id="user.id" :modal-static="false" :view-only="false"></view-edit-component>
    </b-card>
  </b-container>
</template>

<script>
import ViewEditComponent from '../components/User/ViewEditComponent';
import PermissionService from '../services/PermissionService';

export default {
  components: {
    ViewEditComponent
  },
  computed: {
    user () {
      return PermissionService.currentUser;
    }
  }
};

</script>
