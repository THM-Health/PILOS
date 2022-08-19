<template>
  <div v-frag>
    <!-- Remove room -->
    <b-button
      :class="buttonClass"
      variant="danger"
      :title="$t('rooms.modals.delete.title')"
      ref="deleteButton"
      v-b-tooltip.hover
      v-tooltip-hide-click
      @click="$bvModal.show('remove-modal')"
      :disabled="disabled"
    >
      <i class="fa-solid fa-trash"></i>
    </b-button>

    <!-- Remove room modal -->
    <b-modal
      :busy="isDeleting"
      :no-close-on-backdrop="isDeleting"
      :no-close-on-esc="isDeleting"
      :hide-header-close="isDeleting"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      @ok="deleteRoom"
      id="remove-modal" >
      <template v-slot:modal-title>
        {{ $t('rooms.modals.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isDeleting"></b-spinner>  {{ $t('app.yes') }}
      </template>
      {{ $t('rooms.modals.delete.confirm',{name: room.name}) }}
    </b-modal>
  </div>
</template>

<script>
import Base from '../../api/base';
import frag from 'vue-frag';

export default {
  directives: {
    frag
  },
  data () {
    return {
      isDeleting: false // is room getting deleted
    };
  },
  props: {
    room: {
      type: Object,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    buttonClass: {
      type: String,
      default: '',
      required: false
    }
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
