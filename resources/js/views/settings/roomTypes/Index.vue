<template>
  <div>
    <h3>
      {{ $t('app.room_types') }}
      <can method='create' policy='RoomTypePolicy'>
        <b-button
          class='float-right'
          v-b-tooltip.hover
          v-tooltip-hide-click
          variant='success'
          :title="$t('settings.room_types.new')"
          :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
        ><i class="fa-solid fa-plus"></i></b-button>
      </can>
    </h3>
    <hr>

    <b-table
      fixed
      hover
      stacked='lg'
      show-empty
      :busy.sync='isBusy'
      :fields="tableFields"
      :items='roomTypes'
      :per-page='getSetting("pagination_page_size")'
      :current-page="currentPage"
      id='roomTypes-table'
    >

      <template v-slot:empty>
        <i>{{ $t('settings.room_types.no_data') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template #cell(description)="data">
        <text-truncate>
          {{ data.item.description }}
        </text-truncate>
      </template>

      <template v-slot:cell(short)="data">
        <div class="room-icon" :style="{ 'background-color': data.item.color}">{{ data.item.short }}</div>
      </template>

      <template v-slot:cell(actions)="data">
        <b-button-group>
        <can method='view' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            v-tooltip-hide-click
            :title="$t('settings.room_types.view', { name: data.item.description })"
            :disabled='isBusy'
            variant='info'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id }, query: { view: '1' } }"
          >
            <i class='fa-solid fa-eye'></i>
          </b-button>
        </can>
        <can method='update' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            v-tooltip-hide-click
            :title="$t('settings.room_types.edit', { name: data.item.description })"
            :disabled='isBusy'
            variant='secondary'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id } }"
          >
            <i class='fa-solid fa-edit'></i>
          </b-button>
        </can>
        <can method='delete' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            v-tooltip-hide-click
            :title="$t('settings.room_types.delete.item', { id: data.item.description })"
            :disabled='isBusy'
            variant='danger'
            @click='showDeleteModal(data.item)'>
            <i class='fa-solid fa-trash'></i>
          </b-button>
        </can>
        </b-button-group>
      </template>
    </b-table>

    <b-pagination
      v-model='currentPage'
      :total-rows='roomTypes.length'
      :per-page='getSetting("pagination_page_size")'
      aria-controls='roomTypes-table'
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-modal
      :busy='isBusy'
      ok-variant='danger'
      cancel-variant='secondary'
      :cancel-title="$t('app.no')"
      @ok='deleteRoomType'
      @cancel='clearRoomTypeToDelete'
      @close='clearRoomTypeToDelete'
      ref='delete-roomType-modal'
      :static='modalStatic'
      :no-close-on-esc="isBusy"
      :no-close-on-backdrop="isBusy"
      :hide-header-close="isBusy"
    >
      <template v-slot:modal-title>
        {{ $t('settings.room_types.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="roomTypeToDelete">
        {{ $t('settings.room_types.delete.confirm', { name: roomTypeToDelete.description }) }}
      </span>
      <hr>
      <b-form-group v-if="roomTypeToDelete" label-for="replacement-room-type" :description="$t('settings.room_types.delete.replacement_info')" :state="fieldState('replacement_room_type')" :label="$t('settings.room_types.delete.replacement')">
        <b-form-select id="replacement-room-type" :disabled="isBusy" :state="fieldState('replacement_room_type')" v-model.number="replacement" :options="roomTypeSelect"></b-form-select>
        <template slot='invalid-feedback'><div v-html="fieldError('replacement_room_type')"></div></template>
      </b-form-group>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can.vue';
import FieldErrors from '../../../mixins/FieldErrors';
import env from '../../../env';
import ActionsColumn from '../../../mixins/ActionsColumn';
import TextTruncate from '../../../components/TextTruncate.vue';
import { mapState } from 'pinia';
import { useSettingsStore } from '../../../stores/settings';

export default {
  mixins: [FieldErrors, ActionsColumn],
  components: { TextTruncate, Can },

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      currentPage: 1,
      isBusy: false,
      roomTypeToDelete: undefined,
      errors: {},
      replacement: null,
      roomTypes: [],
      actionPermissions: ['roomTypes.view', 'roomTypes.update', 'roomTypes.delete']
    };
  },

  methods: {
    /**
     * Loads the roles from the backend and calls on finish the callback function.
     */
    fetchRoomTypes () {
      this.isBusy = true;
      Base.call('roomTypes').then(response => {
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

      Base.call(`roomTypes/${this.roomTypeToDelete.id}`, {
        method: 'delete',
        data: { replacement_room_type: this.replacement }
      }).then(() => {
        this.fetchRoomTypes();
        this.clearRoomTypeToDelete();
        this.$refs['delete-roomType-modal'].hide();
      }).catch(error => {
        // failed due to form validation errors
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.fetchRoomTypes();
          }
          Base.error(error, this.$root, error.message);
          this.clearRoomTypeToDelete();
          this.$refs['delete-roomType-modal'].hide();
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Clears the temporary property `roomTypeToDelete` on canceling or
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
  },

  computed: {

    ...mapState(useSettingsStore, ['getSetting']),

    tableFields () {
      const fields = [
        { key: 'description', label: this.$t('app.description'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'short', label: this.$t('settings.room_types.icon'), sortable: true, thStyle: { width: '10%' } }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    },

    /**
     * Calculate the room type selection options
     * @returns {null|*}
     */
    roomTypeSelect () {
      const noReplacement = {};
      noReplacement.value = null;
      noReplacement.text = this.$t('settings.room_types.delete.no_replacement');

      if (this.roomTypes) {
        const list = this.roomTypes.filter((roomtype) => {
          return roomtype.id !== this.roomTypeToDelete.id;
        }).map(roomtype => {
          return {
            value: roomtype.id,
            text: roomtype.description
          };
        });
        list.unshift(noReplacement);
        return list;
      }
      return [];
    }
  }
};
</script>
