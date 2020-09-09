<template>
    <b-container class="mt-3 mb-5">
      <h2>{{ $t('rooms.myRooms') }}</h2>
      <b-badge v-if="showLimit">{{ $t('rooms.roomLimit',{has:rooms.myRooms.length,max:currentUser.room_limit}) }}</b-badge><br>

      <em v-if="rooms.myRooms && !rooms.myRooms.length">{{ $t('rooms.noRoomsAvailable') }}</em>

      <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" v-if="rooms.myRooms">
        <b-col v-for="room in rooms.myRooms" :key="room.id" class="pt-2">
          <room-component :id="room.id" :name="room.name" :type="room.type"></room-component>
        </b-col>

        <can method="create" policy="RoomPolicy" v-if="!limitReached">

        <b-col class="pt-2">
          <new-room-component @limitReached="onReachLimit" :room-types="rooms.roomTypes"></new-room-component>
        </b-col>
        </can>
      </b-row>
      <hr>
      <h2>{{ $t('rooms.sharedRooms') }}</h2>
      <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" v-if="rooms.sharedRooms">
        <b-col v-for="room in rooms.sharedRooms" :key="room.id" class="pt-2">
          <room-component :id="room.id" :name="room.name" v-bind:shared="true"  :shared-by="room.owner" :type="room.type"></room-component>
        </b-col>
        <b-col v-if="!rooms.sharedRooms.length" class="pt-2">
          <em>{{ $t('rooms.noRoomsAvailable') }}</em>
        </b-col>
      </b-row>
    </b-container>
</template>

<script>

import RoomComponent from '../../components/Room/RoomComponent.vue';
import NewRoomComponent from '../../components/Room/NewRoomComponent.vue';
import Can from '../../components/Permissions/Can';
import Base from '../../api/base';
import { mapState } from 'vuex';
import store from '../../store';

export default {
  components: {
    RoomComponent,
    NewRoomComponent,
    Can
  },
  computed: {
    ...mapState({
      currentUser: state => state.session.currentUser
    }),
    showLimit: function () {
      return this.currentUser.room_limit !== -1 && this.rooms.myRooms !== undefined;
    },
    limitReached: function () {
      return this.currentUser.room_limit !== -1 && this.rooms.myRooms !== undefined && this.rooms.myRooms.length >= this.currentUser.room_limit;
    }
  },
  methods: {
    // Handle event from new room component that the limit was reached
    onReachLimit () {
      store.dispatch('session/getCurrentUser');
      this.reload();
    },
    reload () {
      Base.call('rooms').then(response => {
        this.rooms = response.data.data;
      });
    }
  },

  data () {
    return {
      rooms: []
    };
  },

  // Component not loaded yet
  beforeRouteEnter  (to, from, next) {
    Base.call('rooms').then(response => {
      next(vm => {
        vm.rooms = response.data.data;
      });
    });
  }
};
</script>
