<template>
      <div class="h-100" >
    <b-overlay :show="loading" class="h-100" rounded="sm" >
<!--      room card-->
      <b-card no-body bg-variant="white" class="room-card h-100" @click="open"  :class="{'running': running}">
        <b-card-body class="p-3 h-100">
          <div class="d-flex flex-column h-100">
            <div class="flex-grow-1">
              <b-row>
                <b-col>
                  <b-badge :style="{ 'background-color': type.color}">{{this.type.description}}</b-badge>
                </b-col>
                <b-col>

                  <div class="text-right" >
                    <b-button @click.stop="showShortDescriptionModal" v-if="shortDescription!=null" size="sm" class="fa-solid fa-info mr-1 p-0" style="height: 25px; width: 25px; font-size: 12px;"></b-button>
                    <b-button @click.stop="toggleFavorite" :variant="isFavorite ? 'dark' : 'light'" size="sm" class="fa-solid fa-star p-0" style="height: 25px; width: 25px; font-size: 12px;"></b-button>
                  </div>
                </b-col>
              </b-row>
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
      </b-card-body>
    </b-card>
    </b-overlay>

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

      <b-row>
        <b-col>
          <b-badge :style="{ 'background-color': type.color}">{{this.type.description}}</b-badge>
        </b-col>
        <b-col>
          <div class="text-right" >
            <b-button @click.stop="toggleFavorite" :variant="isFavorite ? 'dark' : 'light'" size="sm" class="fa-solid fa-star p-0" style="height: 25px; width: 25px; font-size: 12px;"></b-button>
          </div>
        </b-col>
      </b-row>
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

import Base from '../../api/base';

export default {
  data () {
    return {
      loading: false
    };
  },
  props: {
    id: String,
    name: String,
    isFavorite: Boolean,
    shortDescription: String,
    meeting: Object,
    shared: {
      type: Boolean,
      default: false
    },
    type: Object,
    owner: Object,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  methods: {

    /**
     * Add a room to the favorites or delete it from the favorites
     */
    toggleFavorite: function () {
      let config;
      // check if the room must be added or deleted
      if (this.isFavorite) {
        config = { method: 'delete' };
      } else {
        config = { method: 'put' };
      }
      // add or delete room
      Base.call('rooms/' + this.id + '/favorites', config)
        .then(response => {
          this.$emit('favorites_changed');
        }).catch(error => {
          Base.error(error, this);
        });
    },

    /**
     * open the room view
     */
    open: function () {
      this.loading = true;
      this.$router.push({ name: 'rooms.view', params: { id: this.id } }).finally(() => {
        this.loading = false;
      });
    },
    /**
     * Show short description modal
     */
    showShortDescriptionModal () {
      this.$bvModal.show('short-description-modal-' + this.id);
    }

  },
  computed: {
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
