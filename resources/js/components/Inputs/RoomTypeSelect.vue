<template>
  <b-input-group>
    <b-input-group-prepend
      v-if="modelLoadingError"
      class="flex-grow-1"
      style="width: 1%"
    >
      <b-alert
        class="mb-0 w-100"
        show
        variant="danger"
      >
        {{ $t('rooms.room_types.loading_error') }}
      </b-alert>
    </b-input-group-prepend>
    <b-form-select
      v-else
      v-model="roomType"
      :disabled="disabled || isLoadingAction"
      :state="state"
      :options="roomTypeSelect"
      @change="changeRoomType"
    >
      <template #first>
        <b-form-select-option
          :value="null"
          disabled
        >
          {{ $t('rooms.room_types.select_type') }}
        </b-form-select-option>
      </template>
    </b-form-select>
    <b-input-group-append>
      <!-- Reload the room types -->
      <b-button
        v-b-tooltip.hover
        v-tooltip-hide-click
        :disabled="disabled || isLoadingAction"
        variant="outline-secondary"
        :title="$t('rooms.room_types.reload')"
        @click="reloadRoomTypes"
      >
        <i
          class="fa-solid fa-sync"
          :class="{ 'fa-spin': isLoadingAction }"
        />
      </b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import Base from '@/api/base';
export default {
  name: 'RoomTypeSelect',
  props: {
    value: Object,
    state: Boolean,
    disabled: Boolean,
    roomId: String
  },

  data () {
    return {
      roomType: this.value?.id ?? null,
      roomTypes: [],
      modelLoadingError: false,
      isLoadingAction: false
    };
  },

  computed: {
    /**
     * Calculate the room type selection options
     * @returns {null|*}
     */
    roomTypeSelect () {
      if (this.roomTypes) {
        return this.roomTypes.map(roomtype => {
          const entry = {};
          entry.value = roomtype.id;
          entry.text = roomtype.description;
          return entry;
        });
      }
      return null;
    }
  },

  watch: {
    // detect changes from the parent component and update select
    value: function () {
      this.roomType = this.value?.id ?? null;
    },

    // detect changes of the model loading error
    modelLoadingError: function () {
      this.$emit('loading-error', this.modelLoadingError);
    },

    // detect busy status while data fetching and notify parent
    isLoadingAction: function () {
      this.$emit('busy', this.isLoadingAction);
    }
  },

  mounted () {
    this.reloadRoomTypes();
  },

  methods: {

    // detect changes of the select and notify parent
    changeRoomType: function () {
      const roomType = this.roomTypes.find((roomType) => roomType.id === this.roomType) ?? null;
      this.$emit('input', roomType);
    },

    // Load the room types
    reloadRoomTypes () {
      this.isLoadingAction = true;
      const config = {
        params: {
          filter: this.roomId === undefined ? 'own' : this.roomId
        }
      };

      Base.call('roomTypes', config).then(response => {
        this.roomTypes = response.data.data;
        // check if roomType select value is not included in available room type list
        // if so, unset roomType field
        if (this.roomType && !this.roomTypes.map(type => type.id).includes(this.roomType)) {
          this.roomType = null;
          this.$emit('input', null);
        }
        this.modelLoadingError = false;
      }).catch(error => {
        this.modelLoadingError = true;
        Base.error(error, this);
      }).finally(() => {
        this.isLoadingAction = false;
      });
    }
  }
};
</script>
