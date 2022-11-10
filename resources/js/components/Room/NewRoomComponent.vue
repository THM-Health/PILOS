<template>
  <div>
    <b-card no-body class="room-card" @click="$bvModal.show('new-room')">
      <b-card-body class="p-3">
       <h5 class="mt-2"><i class="fa-solid fa-plus mr-3"></i> {{ $t('rooms.create.title') }}</h5>
      </b-card-body>
    </b-card>

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
import store from '../../store';
import FieldErrors from '../../mixins/FieldErrors';
import env from './../../env.js';
import RoomTypeSelect from '../RoomType/RoomTypeSelect';
import _ from 'lodash';

export default {
  components: { RoomTypeSelect },
  mixins: [FieldErrors],

  props: {
    modalStatic: {
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
            this.flashMessage.error(this.$t('rooms.flash.noNewRoom'));
            this.$bvModal.hide('new-room');
            store.dispatch('session/getCurrentUser');
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
