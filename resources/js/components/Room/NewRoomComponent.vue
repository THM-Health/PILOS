<template>
  <div>
    <b-card no-body class="roomcard" @click="$bvModal.show('new-room')">
      <b-card-body class="p-3">
       <h5 class="mt-2"><b-icon-plus class="mr-3"></b-icon-plus> {{ $t('rooms.create.title') }}</h5>
      </b-card-body>
    </b-card>

    <b-modal
      id="new-room"
      :title="$t('rooms.create.title')"
      :busy="isLoadingAction"
      ok-variant="success"
      :ok-title="$t('rooms.create.ok')"
      :cancel-title="$t('rooms.create.cancel')"
      :static="modalStatic"
      @ok="handleOk"
      @hidden="handleCancel"
    >
      <b-form-group :state="fieldState('roomType')" :label="$t('rooms.settings.general.type')">
        <b-input-group>
          <b-form-select :state="fieldState('roomType')" v-model.number="room.roomType" :options="roomTypeSelect"></b-form-select>
        </b-input-group>
        <template slot='invalid-feedback'><div v-html="fieldError('roomType')"></div></template>
      </b-form-group>
      <!-- Room name -->
      <b-form-group :state="fieldState('name')" :label="$t('rooms.settings.general.roomName')">
        <b-input-group>
          <b-form-input :state="fieldState('name')" v-model="room.name"></b-form-input>
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

export default {
  mixins: [FieldErrors],

  props: {
    roomTypes: Array,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isLoadingAction: false,
      room: {},
      errors: {}
    };
  },
  methods: {
    handleOk: function (bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },

    handleCancel: function () {
      this.room = {};
    },

    handleSubmit () {
      this.isLoadingAction = true;
      Base.call('rooms', {
        method: 'post',
        data: this.room
      }).then(response => {
        this.$router.push({ name: 'rooms.view', params: { id: response.data.data.id } });
      }).catch((error) => {
        this.isLoadingAction = false;
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            // TODO reload room type list if failed
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

  },
  computed: {
    /**
     * Calculate the room type selection options
     * @returns {null|*}
     */
    roomTypeSelect () {
      if (this.roomTypes) {
        return this.roomTypes.map(roomtype => {
          var entry = {};
          entry.value = roomtype.id;
          entry.text = roomtype.description;
          return entry;
        });
      }
      return null;
    }
  }
};
</script>
<style scoped>
.roomcard{
  background: none;
  border-style: dotted;
}
</style>
