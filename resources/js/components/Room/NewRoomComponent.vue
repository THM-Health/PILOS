<template>
  <div>
    <b-button class="float-right" :disabled="disabled" variant="primary" @click="$bvModal.show('new-room')"> <i class="fa-solid fa-plus"></i> {{ $t('rooms.create.title') }} </b-button>

    <b-modal
      id="new-room"
      :title="$t('rooms.create.title')"
      :busy="isLoadingAction || roomTypeSelectBusy"
      ok-variant="success"
      :ok-title="$t('rooms.create.ok')"
      :cancel-title="$t('app.cancel')"
      :static="modalStatic"
      :ok-disabled="roomTypeSelectLoadingError"
      @ok="handleOk"
      @hidden="handleCancel"
      :no-close-on-esc="isLoadingAction || roomTypeSelectBusy"
      :no-close-on-backdrop="isLoadingAction || roomTypeSelectBusy"
      :hide-header-close="isLoadingAction || roomTypeSelectBusy"
    >
      <b-form-group :state="fieldState('room_type')" :label="$t('rooms.settings.general.type')">
        <room-type-select
          :disabled="isLoadingAction"
          v-on:loadingError="(value) => this.roomTypeSelectLoadingError = value"
          v-on:busy="(value) => this.roomTypeSelectBusy = value"
          ref="roomTypeSelect"
          v-model="room.room_type"
          :state="fieldState('room_type')"
        ></room-type-select>
        <template slot='invalid-feedback'><div v-html="fieldError('room_type')"></div></template>
      </b-form-group>
      <!-- Room name -->
      <b-form-group :state="fieldState('name')" :label="$t('rooms.name')">
        <b-input-group>
          <b-form-input
            :disabled="isLoadingAction"
            :state="fieldState('name')"
            v-model="room.name"
          ></b-form-input>
        </b-input-group>
        <template slot='invalid-feedback'><div v-html="fieldError('name')"></div></template>
      </b-form-group>
    </b-modal>

  </div>
</template>
<script>
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from './../../env.js';
import RoomTypeSelect from '../Inputs/RoomTypeSelect.vue';
import _ from 'lodash';
import { mapActions } from 'pinia';
import { useAuthStore } from '../../stores/auth';

export default {
  components: { RoomTypeSelect },
  mixins: [FieldErrors],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      roomTypeSelectBusy: false,
      roomTypeSelectLoadingError: false,
      isLoadingAction: false,
      room: {
        room_type: null
      },
      errors: {}
    };
  },
  methods: {
    handleOk: function (bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },

    handleCancel: function () {
      this.room = { room_type: null };
    },

    ...mapActions(useAuthStore, ['getCurrentUser']),

    handleSubmit () {
      this.isLoadingAction = true;

      const newRoom = _.clone(this.room);
      newRoom.room_type = newRoom.room_type ? newRoom.room_type.id : null;

      Base.call('rooms', {
        method: 'post',
        data: newRoom
      }).then(response => {
        this.errors = {};
        this.$router.push({ name: 'rooms.view', params: { id: response.data.data.id } });
      }).catch((error) => {
        this.isLoadingAction = false;
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            if (error.response.data.errors.room_type !== undefined) {
              this.$refs.roomTypeSelect.reloadRoomTypes();
            }

            this.errors = error.response.data.errors;
            return;
          }
          // permission denied
          if (error.response.status === env.HTTP_FORBIDDEN) {
            this.toastError(this.$t('rooms.flash.no_new_room'));
            this.$bvModal.hide('new-room');
            this.getCurrentUser();
            return;
          }
          // room limit exceeded
          if (error.response.status === env.HTTP_ROOM_LIMIT_EXCEEDED) {
            this.$emit('limitReached');
          }
        }
        this.$bvModal.hide('new-room');
        Base.error(error, this.$root);
      });
    }

  }

};
</script>
<style scoped>
.room-card{
  background: none;
  border-style: dotted;
}
</style>
