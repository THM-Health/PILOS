<template>
  <div>
    <h3>
      {{ $t('settings.roomTypes.title') }}
      <can method='create' policy='RoomTypePolicy'>
        <b-button
          class='float-right'
          v-b-tooltip.hover
          variant='success'
          :title="$t('settings.roomTypes.new')"
          :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
        ><b-icon-plus></b-icon-plus></b-button>
      </can>
    </h3>
    <hr>

    <b-table
      hover
      stacked='md'
      show-empty
      :busy.sync='isBusy'
      :fields="tableFields"
      :items='roomTypes'
      id='roles-table'
    >

      <template v-slot:empty>
        <i>{{ $t('settings.roomTypes.nodata') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:cell(short)="data">
        <div class="roomicon" :style="{ 'background-color': data.item.color}">{{ data.item.short }}</div>
      </template>

      <template v-slot:cell(actions)="data">
        <can method='view' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.view', { name: data.item.description })"
            :disabled='isBusy'
            variant='primary'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id }, query: { view: '1' } }"
          >
            <i class='fas fa-eye'></i>
          </b-button>
        </can>
        <can method='update' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.edit', { name: data.item.description })"
            :disabled='isBusy'
            variant='dark'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id } }"
          >
            <i class='fas fa-edit'></i>
          </b-button>
        </can>
        <can method='delete' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.delete.item', { id: data.item.description })"
            :disabled='isBusy'
            variant='danger'
            @click='showDeleteModal(data.item)'>
            <i class='fas fa-trash'></i>
          </b-button>
        </can>
      </template>
    </b-table>

    <b-modal
      :busy='isBusy'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.false')"
      @ok='deleteRoomType'
      @cancel='clearRoomTypeToDelete'
      @close='clearRoomTypeToDelete'
      ref='delete-roomType-modal'
      :static='modalStatic'>
      <template v-slot:modal-title>
        {{ $t('settings.roomTypes.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.true') }}
      </template>
      <span v-if="roomTypeToDelete">
        {{ $t('settings.roomTypes.delete.confirm', { name: roomTypeToDelete.description }) }}
      </span>
      <hr>
      <b-form-group v-if="roomTypeToDelete" :description="$t('settings.roomTypes.delete.replacementInfo')" :state="fieldState('replacement_room_type')" :label="$t('settings.roomTypes.delete.replacement')">
        <b-input-group>
          <b-form-select :disabled="isBusy" :state="fieldState('replacement_room_type')" v-model.number="replacement" :options="roomTypeSelect"></b-form-select>
        </b-input-group>
        <template slot='invalid-feedback'><div v-html="fieldError('replacement_room_type')"></div></template>
      </b-form-group>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can';
import PermissionService from '../../../services/PermissionService';
import FieldErrors from '../../../mixins/FieldErrors';
import env from '../../../env';

export default {
  mixins: [FieldErrors],
  components: { Can },

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      isBusy: false,
      roomTypeToDelete: undefined,
      errors: {},
      replacement: null,
      roomTypes: []
    };
  },

  methods: {
    /**
     * Loads the roles from the backend and calls on finish the callback function.
     */
    fetchRoomTypes () {
      this.isBusy = true;
      Base.call('room_types').then(response => {
        this.roomTypes = response.data.data;
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Shows the delete modal with the passed room type.
     *
     * @param roomType room type that should be deleted.
     */
    showDeleteModal (roomType) {
      this.roomTypeToDelete = roomType;
      this.$refs['delete-roomType-modal'].show();
    },

    /**
     * Deletes the room type that is set in the property `roomTypeToDelete`.
     */
    deleteRoomType (bvModalEvt) {
      // prevent modal from closing
      bvModalEvt.preventDefault();
      this.isBusy = true;

      Base.call(`room_types/${this.roomTypeToDelete.id}`, {
        method: 'delete',
        data: { replacement_room_type: this.replacement }
      }).then(() => {
        this.fetchRoomTypes();
        this.clearRoomTypeToDelete();
        this.$refs['delete-roomType-modal'].hide();
      }).catch(error => {
        // adding failed
        if (error.response) {
          // failed due to form validation errors
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
            return;
          }
        }
        Base.error(error, this.$root, error.message);
        this.clearRoomTypeToDelete();
        this.$refs['delete-roomType-modal'].hide();
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Clears the temporary property `roleToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearRoomTypeToDelete () {
      this.roomTypeToDelete = undefined;
    }

  },

  /**
   * Sets the event listener for current user change to re-evaluate whether the
   * action column should be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    this.fetchRoomTypes();
    this.toggleActionsColumn();
  },

  computed: {

    tableFields () {
      var fields = [
        { key: 'description', label: this.$t('settings.roomTypes.description'), sortable: true },
        { key: 'short', label: this.$t('settings.roomTypes.icon'), sortable: true }
      ];

      if (PermissionService.currentUser && (['room_types.view', 'room_types.update', 'room_types.delete'].some(permission => PermissionService.currentUser.permissions.includes(permission)))) {
        if (fields[fields.length - 1].key !== 'actions') {
          fields.push({ key: 'actions', label: this.$t('settings.roomTypes.actions') });
        }
      } else if (fields[fields.length - 1].key === 'actions') {
        fields.pop();
      }
      return fields;
    },

    /**
     * Calculate the room type selection options
     * @returns {null|*}
     */
    roomTypeSelect () {
      var roomTypeToDelete = this.roomTypeToDelete;

      var noReplacement = {};
      noReplacement.value = null;
      noReplacement.text = this.$t('settings.roomTypes.delete.noReplacement');

      if (this.roomTypes) {
        var list = this.roomTypes.filter(function (roomtype) {
          return roomtype.id !== roomTypeToDelete.id;
        }).map(roomtype => {
          var entry = {};
          entry.value = roomtype.id;
          entry.text = roomtype.description;
          return entry;
        });
        list.unshift(noReplacement);
        return list;
      }
      return null;
    }
  }
};
</script>
