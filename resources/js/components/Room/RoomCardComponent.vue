<template>
      <div class="h-100" >
    <!-- room card-->
      <b-card role="button" tabindex="0" no-body bg-variant="white" class="room-card h-100" @click="open" @keyup.enter="open" :class="{'room-card--running': running}">
        <b-card-body class="p-3 h-100">
          <div class="d-flex flex-column h-100">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <room-type-badge :roomType="room.type"/>
                <div class="room-card__buttons flex-shrink-0" >
                    <b-button @click.stop="showModal = true" v-if="room.short_description!=null" size="sm" class="fa-solid fa-info" ></b-button>
                    <room-favorite-button @favorites_changed="$emit('favorites_changed')" :room="room"/>
                </div>
              </div>
              <h5 class="mt-2 text-break " style="width: 100% ">{{room.name}}</h5>
            </div>
            <room-details-component :room="room"/>
          </div>
          <b-link class="stretched-link" :to="link" aria-hidden="true"></b-link>
      </b-card-body>
    </b-card>

    <!-- More details modal-->
    <b-modal
      :static='modalStatic'
      ok-variant="primary"
      @ok="open"
      :ok-title="$t('rooms.index.room_component.open')"
      :cancel-title="$t('app.close')"
      :title="$t('rooms.index.room_component.details')"
      v-model="showModal"
    >
      <div class="d-flex justify-content-between align-items-start">
        <room-type-badge :roomType="room.type"/>
        <div class="room-card-buttons flex-shrink-0" >
            <room-favorite-button @favorites_changed="$emit('favorites_changed')" :room="room"/>
        </div>
      </div>
      <h5 class="mt-2 text-break " style="width: 100% ">{{room.name}}</h5>
      <room-details-component :room="room" :showDescription="true"/>
    </b-modal>
  </div>

</template>
<script>

import RoomFavoriteButton from './RoomFavoriteButton.vue';
import RoomDetailsComponent from './RoomDetailsComponent.vue';
import RoomTypeBadge from './RoomTypeBadge.vue';

export default {
  components: { RoomDetailsComponent, RoomFavoriteButton, RoomTypeBadge },
  props: {
    room: Object,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      showModal: false
    };
  },
  methods: {

    /**
     * Open the room view
     */
    open: function () {
      this.$router.push(this.link);
    }

  },
  computed: {

    link: function () {
      return this.$router.resolve({ name: 'rooms.view', params: { id: this.room.id } }).href;
    },

    /**
     * Check if there is a running meeting for this room
     * @returns {boolean}
     */
    running: function () {
      return this.room.last_meeting != null && this.room.last_meeting.end == null;
    }
  }
};
</script>
