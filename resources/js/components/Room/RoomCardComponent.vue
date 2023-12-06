<template>
  <div class="h-100">
    <!-- room card-->
    <b-card
      role="button"
      tabindex="0"
      no-body
      bg-variant="white"
      class="room-card h-100"
      :class="{'room-card--running': running}"
      @click="open"
      @keyup.enter="open"
    >
      <b-card-body class="p-3 h-100">
        <div class="d-flex flex-column h-100">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <room-type-badge
                :room-type="room.type"
              />
              <div class="room-card__buttons flex-shrink-0">
                <b-button
                  v-if="room.short_description!=null"
                  size="sm"
                  class="fa-solid fa-info"
                  @click.stop="showModal = true"
                />
                <room-favorite-button
                  :room="room"
                  @favorites-changed="$emit('favorites-changed')"
                />
              </div>
            </div>
            <h5
              class="mt-2 text-break "
              style="width: 100% "
            >
              {{ room.name }}
            </h5>
          </div>
          <room-details-component
            :room="room"
          />
        </div>
        <b-link
          class="stretched-link"
          :to="link"
          aria-hidden="true"
        />
      </b-card-body>
    </b-card>

    <!-- More details modal-->
    <b-modal
      v-model="showModal"
      :static="modalStatic"
      ok-variant="primary"
      :ok-title="$t('rooms.index.room_component.open')"
      :cancel-title="$t('app.close')"
      :title="$t('rooms.index.room_component.details')"
      @ok="open"
    >
      <div class="d-flex justify-content-between align-items-start">
        <room-type-badge :room-type="room.type" />
        <div class="room-card-buttons flex-shrink-0">
          <room-favorite-button
            :room="room"
            @favorites-changed="$emit('favorites-changed')"
          />
        </div>
      </div>
      <h5
        class="mt-2 text-break "
        style="width: 100% "
      >
        {{ room.name }}
      </h5>
      <room-details-component
        :room="room"
        :show-description="true"
      />
    </b-modal>
  </div>
</template>
<script>

import RoomFavoriteButton from './RoomFavoriteButton.vue';
import RoomDetailsComponent from './RoomDetailsComponent.vue';
import RoomTypeBadge from './RoomTypeBadge.vue';

export default {
  name: 'RoomCardComponent',
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
  },
  methods: {

    /**
     * Open the room view
     */
    open: function () {
      this.$router.push(this.link);
    }

  }
};
</script>
