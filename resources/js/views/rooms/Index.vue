<template>
    <b-container class="mt-3 mb-5">
      <h2>{{ $t('rooms.myRooms') }}</h2>
      <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" v-if="rooms.myRooms">
        <b-col v-for="room in rooms.myRooms" :key="room.id" class="pt-2">
          <room-component :id="room.id" :name="room.name" :type="room.type"></room-component>
        </b-col>
        <b-col v-if="!rooms.myRooms.length" class="pt-2">
          <em>{{ $t('rooms.noRoomsAvailable') }}</em>
        </b-col>
        <can method="create" policy="RoomPolicy">
        <b-col class="pt-2">
          <new-room-component :room-types="rooms.roomTypes"></new-room-component>
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

export default {
  components: {
    RoomComponent,
    NewRoomComponent,
    Can
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
