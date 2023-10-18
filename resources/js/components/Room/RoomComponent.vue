<template>
      <div class="h-100" >
    <!-- room card-->
      <b-card role="button" tabindex="0" no-body bg-variant="white" class="room-card h-100" @click="open" @keyup.enter="open" :class="{'running': running}">
        <b-card-body class="p-3 h-100">
          <div class="d-flex flex-column h-100">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <b-badge class="flex-shrink-1 text-break" style="white-space: normal" :style="{ 'background-color': type.color}">{{this.type.description}}</b-badge>

                <div class="room-card-buttons flex-shrink-0" >
                    <b-button @click.stop="showShortDescriptionModal" v-if="shortDescription!=null" size="sm" class="fa-solid fa-info" ></b-button>
                    <RoomFavoriteComponent @favorites_changed="$emit('favorites_changed')" :is-favorite="isFavorite" :size="'sm'" :id="id"></RoomFavoriteComponent>
                </div>
              </div>
              <h5 class="mt-2 text-break " style="width: 100% ">{{name}}</h5>
            </div>
            <div>
              <div class="d-flex">
                <div class="room-card-info-icon">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="room-info-text">
                  <small>{{ owner.name }}</small>
                </div>
              </div>
              <div class="d-flex">
                <div class="room-card-info-icon">
                  <i class="fa-solid fa-clock"></i>
                </div>
                <div class="room-info-text">
                  <small>
                  <span v-if="meeting==null"> {{$t('rooms.index.room_component.never_started')}}</span>
                  <span v-else-if="meeting.start!=null && meeting.end!=null">{{$t('rooms.index.room_component.last_ran_till', {date:$d(new Date(meeting.end),'datetimeShort')})}}</span>
                  <span v-else-if="meeting.end==null"> {{$t('rooms.index.room_component.running_since', {date:$d(new Date(meeting.start),'datetimeShort')})}}</span>
                  <span v-else> {{$t('rooms.index.room_component.meeting_starting')}}</span>
                  </small>
                </div>
              </div>
            </div>
          </div>
          <b-link class="stretched-link" :to="{ name: 'rooms.view', params: { id: this.id }}" aria-hidden="true"></b-link>
      </b-card-body>
    </b-card>

<!--    short Description Modal-->
    <b-modal
      :static='modalStatic'
      ref="short-description-modal"
      :id="'short-description-modal-' + id"
      ok-variant="primary"
      @ok="open()"
      :ok-title="$t('rooms.index.room_component.open')"
      :cancel-title="$t('app.close')"
      :title="$t('rooms.index.room_component.details')"
    >
      <div class="d-flex justify-content-between align-items-start">
        <b-badge class="flex-shrink-1 text-break" style="white-space: normal" :style="{ 'background-color': type.color}">{{this.type.description}}</b-badge>
        <div class="room-card-buttons flex-shrink-0" >
            <RoomFavoriteComponent @favorites_changed="$emit('favorites_changed')" :is-favorite="isFavorite" :size="'sm'" :id="id"></RoomFavoriteComponent>
        </div>
      </div>
      <h5 class="mt-2 text-break " style="width: 100% ">{{name}}</h5>
      <div>
        <div class="d-flex">
          <div class="room-info-icon">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="room-info-text">
            {{ owner.name }}
          </div>
        </div>

        <div class="d-flex">
          <div class="room-info-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="room-info-text">
            <span v-if="meeting==null"> {{$t('rooms.index.room_component.never_started')}}</span>
            <span v-else-if="meeting.start!=null && meeting.end!=null">{{$t('rooms.index.room_component.last_ran_till', {date:$d(new Date(meeting.end),'datetimeShort')})}}</span>
            <span v-else-if="meeting.end==null"> {{$t('rooms.index.room_component.running_since', {date:$d(new Date(meeting.start),'datetimeShort')})}}</span>
            <span v-else> {{$t('rooms.index.room_component.meeting_starting')}}</span>
          </div>
        </div>

        <div class="d-flex">
          <div class="room-info-icon">
            <i class="fa-solid fa-info-circle"></i>
          </div>
          <div class="room-info-text">
            <p style="word-break: break-word">{{ shortDescription }} </p>
          </div>
        </div>
      </div>
    </b-modal>
  </div>

</template>
<script>

import RoomFavoriteComponent from './RoomFavoriteComponent.vue';

export default {
  components: { RoomFavoriteComponent },
  props: {
    id: String,
    name: String,
    isFavorite: Boolean,
    shortDescription: String,
    meeting: Object,
    type: Object,
    owner: Object,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  methods: {

    /**
     * open the room view
     */
    open: function () {
      this.$router.push(this.link);
    },
    /**
     * Show short description modal
     */
    showShortDescriptionModal () {
      this.$bvModal.show('short-description-modal-' + this.id);
    }

  },
  computed: {

    link: function () {
      return this.$router.resolve({ name: 'rooms.view', params: { id: this.id } }).href;
    },
    /**
     * Check if there is a running meeting for this room
     * @returns {boolean}
     */
    running: function () {
      return this.meeting != null && this.meeting.start != null && this.meeting.end == null;
    }
  }
};
</script>
<style scoped>

</style>
