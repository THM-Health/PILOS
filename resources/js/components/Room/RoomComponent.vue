<template>
      <div class="h-100" >
    <!-- room card-->
      <b-card role="button" tabindex="0" no-body bg-variant="white" class="room-card h-100" @click="open" @keyup.enter="open" :class="{'running': running}">
        <b-card-body class="p-3 h-100">
          <div class="d-flex flex-column h-100">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <b-badge class="flex-shrink-1 text-break" style="white-space: normal" :style="{ 'background-color': room.type.color}">{{room.type.description}}</b-badge>

                <div class="room-card-buttons flex-shrink-0" >
                    <b-button @click.stop="showShortDescriptionModal" v-if="room.short_description!=null" size="sm" class="fa-solid fa-info" ></b-button>
                    <RoomFavoriteComponent @favorites_changed="$emit('favorites_changed')" :is-favorite="room.is_favorite" :size="'sm'" :id="room.id"></RoomFavoriteComponent>
                </div>
              </div>
              <h5 class="mt-2 text-break " style="width: 100% ">{{room.name}}</h5>
            </div>
            <room-details-component :room="room"/>
          </div>
          <b-link class="stretched-link" :to="{ name: 'rooms.view', params: { id: room.id }}" aria-hidden="true"></b-link>
      </b-card-body>
    </b-card>

<!--    short Description Modal-->
    <b-modal
      :static='modalStatic'
      ref="short-description-modal"
      :id="'short-description-modal-' + room.id"
      ok-variant="primary"
      @ok="open()"
      :ok-title="$t('rooms.index.room_component.open')"
      :cancel-title="$t('app.close')"
      :title="$t('rooms.index.room_component.details')"
    >
      <div class="d-flex justify-content-between align-items-start">
        <b-badge class="flex-shrink-1 text-break" style="white-space: normal" :style="{ 'background-color': room.type.color}">{{room.type.description}}</b-badge>
        <div class="room-card-buttons flex-shrink-0" >
            <RoomFavoriteComponent @favorites_changed="$emit('favorites_changed')" :is-favorite="room.is_favorite" :size="'sm'" :id="room.id"></RoomFavoriteComponent>
        </div>
      </div>
      <h5 class="mt-2 text-break " style="width: 100% ">{{room.name}}</h5>
      <room-details-component :room="room" :showDescription="true"/>
    </b-modal>
  </div>

</template>
<script>

import RoomFavoriteComponent from './RoomFavoriteComponent.vue';
import RoomDetailsComponent from './RoomDetailsComponent.vue';

export default {
  components: { RoomDetailsComponent, RoomFavoriteComponent },
  props: {
    room: Object,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  methods: {

    /**
     * Open the room view
     */
    open: function () {
      this.$router.push(this.link);
    },
    /**
     * Show short description modal
     */
    showShortDescriptionModal () {
      this.$bvModal.show('short-description-modal-' + this.room.id);
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
      return this.room.latest_meeting != null && this.room.latest_meeting.end == null;
    }
  }
};
</script>
