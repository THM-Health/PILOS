<template>
  <b-container class="mt-3 mb-5">
    <b-card class="p-3 border bg-white">
      <h3>
        {{ $t('app.profile') }}
      </h3>
      <hr>

      <b-overlay :show="!currentUser">
        <template #overlay>
          <div class="text-center">
            <b-spinner />
          </div>
        </template>
        <view-edit-component
          v-if="currentUser"
          :id="currentUser.id"
        />
      </b-overlay>
    </b-card>
  </b-container>
</template>

<script>
import ViewEditComponent from '@/components/User/ViewEditComponent.vue';
import { useAuthStore } from '@/stores/auth';
import { mapState } from 'pinia';

export default {
  components: {
    ViewEditComponent
  },
  computed: {
    ...mapState(useAuthStore, ['currentUser'])
  }
};

</script>
