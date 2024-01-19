<template>
  <!-- Remove room -->
  <b-dropdown-item-button
    ref="deleteButton"
    :disabled="disabled"
    @click="$bvModal.show('remove-modal')"
  >
    <div class="d-flex align-items-baseline">
      <i class="fa-solid fa-trash" />
      <span>{{ $t('rooms.modals.delete.title') }}</span>
    </div>
  </b-dropdown-item-button>

  <!-- Remove room modal -->
  <b-modal
    id="remove-modal"
    :busy="isDeleting"
    :no-close-on-backdrop="isDeleting"
    :no-close-on-esc="isDeleting"
    :hide-header-close="isDeleting"
    ok-variant="danger"
    cancel-variant="secondary"
    :cancel-title="$t('app.no')"
    @ok="deleteRoom"
  >
    <template #modal-title>
      {{ $t('rooms.modals.delete.title') }}
    </template>
    <template #modal-ok>
      <b-spinner
        v-if="isDeleting"
        small
      />  {{ $t('app.yes') }}
    </template>
    {{ $t('rooms.modals.delete.confirm',{name: room.name}) }}
  </b-modal>
</template>

<script>
import Base from '@/api/base';

export default {
  props: {
    room: {
      type: Object,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data () {
    return {
      isDeleting: false // is room getting deleted
    };
  },
  methods: {
    /**
       * Handle deleting of the current room
       */
    deleteRoom: function (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();
      // Change modal state to busy
      this.isDeleting = true;
      // Remove room
      Base.call('rooms/' + this.room.id, {
        method: 'delete'
      }).then(response => {
        // delete successful
        this.$emit('roomDeleted');
      }).catch((error) => {
        this.isDeleting = false;
        this.$bvModal.hide('remove-modal');
        Base.error(error, this.$root);
      });
    }
  }
};
</script>
<style scoped>

</style>
