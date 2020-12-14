<template>
  <b-input-group>
    <b-form-select :disabled="isLoadingAction" :state="state" v-model.number="roomType" :options="roomTypeSelect">
      <template #first>
        <b-form-select-option :value="null" disabled>{{ $t('rooms.settings.general.selectType') }}</b-form-select-option>
      </template>
    </b-form-select>
    <b-input-group-append>
      <!-- Reload the room types -->
      <b-button
        @click="reloadRoomTypes"
        :disabled="isLoadingAction"
        variant="outline-secondary"
      ><i class="fas fa-sync"  v-bind:class="{ 'fa-spin': isLoadingAction  }"></i
      ></b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import Base from '../../api/base';
export default {
  props: ['value', 'state'],

  data () {
    return {
      roomType: this.value,
      roomTypes: [],
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
          var entry = {};
          entry.value = roomtype.id;
          entry.text = roomtype.description;
          return entry;
        });
      }
      return null;
    }
  },

  mounted () {
    this.reloadRoomTypes();
  },

  watch: {
    // detect changes from the parent component and update select
    value: function () {
      this.roomType = this.value;
    },

    // detect changes of the select and notify parent
    roomType: function () {
      this.$emit('input', this.roomType);
    },

    // detect busy status while data fetching and notify parent
    isLoadingAction: function () {
      this.$emit('busy', this.isLoadingAction);
    }
  },

  methods: {
    // Load the room types
    reloadRoomTypes () {
      this.isLoadingAction = true;
      Base.call('roomTypes').then(response => {
        this.roomTypes = response.data.data;
        // check if roomType select value is not included in available room type list
        // if so, unset roomType field
        if (!this.roomTypes.map(type => type.id).includes(this.roomType)) { this.roomType = null; }
      }).catch(error => {
        Base.error(error, this);
      }).finally(() => {
        this.isLoadingAction = false;
      });
    }
  }
};
</script>
