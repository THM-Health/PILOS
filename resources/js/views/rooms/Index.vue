<template>
    <b-container class="mt-3 mb-5">
      <h2>{{ $t('rooms.myRooms') }}</h2>
      <b-overlay :show="loadingOwn" >
        <b-badge v-if="showLimit">{{ $t('rooms.roomLimit',{has:ownRooms.length,max:currentUser.room_limit}) }}</b-badge><br>

        <em v-if="!ownRooms.length">{{ $t('rooms.noRoomsAvailable') }}</em>

        <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" v-if="ownRooms">
          <b-col v-for="room in ownRooms" :key="room.id" class="pt-2">
            <room-component :id="room.id" :name="room.name" :type="room.type"></room-component>
          </b-col>

          <can method="create" policy="RoomPolicy" v-if="!limitReached">
          <b-col class="pt-2">
            <new-room-component  v-if="roomTypes" @limitReached="onReachLimit" :room-types="roomTypes"></new-room-component>
          </b-col>
          </can>
        </b-row>
      </b-overlay>
      <hr>
      <h2>{{ $t('rooms.sharedRooms') }}</h2>
      <b-overlay :show="loadingShared" >
        <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" v-if="sharedRooms">
          <b-col v-for="room in sharedRooms" :key="room.id" class="pt-2">
            <room-component :id="room.id" :name="room.name" v-bind:shared="true"  :shared-by="room.owner" :type="room.type"></room-component>
          </b-col>
          <b-col v-if="!sharedRooms.length" class="pt-2">
            <em>{{ $t('rooms.noRoomsAvailable') }}</em>
          </b-col>
        </b-row>
      </b-overlay>
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
      return this.currentUser.room_limit !== -1 && this.ownRooms !== undefined;
    },
    limitReached: function () {
      return this.currentUser.room_limit !== -1 && this.ownRooms !== undefined && this.ownRooms.length >= this.currentUser.room_limit;
    }
  },
  mounted: function () {
    this.loadOwnRooms();
    this.loadSharedRooms();
    this.loadRoomTypes();
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
      }).catch((error) => {
        Base.error(error, this.$root);
      });
    },
    loadRoomTypes () {
      Base.call('roomTypes').then(response => {
        this.roomTypes = response.data.data;
      });
    },
    loadSharedRooms () {
      this.loadingShared = true;
      Base.call('rooms?filter=shared').then(response => {
        this.sharedRooms = response.data.data;
      }).finally(() => {
        this.loadingShared = false;
      });
    },
    loadOwnRooms () {
      this.loadingOwn = true;
      Base.call('rooms?filter=own').then(response => {
        this.ownRooms = response.data.data;
      }).finally(() => {
        this.loadingOwn = false;
      });
    }
  },

  data () {
    return {
      loadingOwn: false,
      loadingShared: false,
      ownRooms: [],
      sharedRooms: [],
      roomTypes: null
    };
  }

  // Component not loaded yet
  /*

  beforeRouteEnter  (to, from, next) {
    Base.call('rooms?filter=own').then(response => {
      const myRooms = response.data.data;
      Base.call('rooms?filter=shared').then(response => {
        const sharedRooms = response.data.data;

        next(vm => {
          vm.myRooms = myRooms;
          vm.sharedRooms = sharedRooms;
        });
      }).catch((error) => {
        if (from.matched.length !== 0) {
          next(error);
        } else {
          next(vm => {
            Base.error(error, vm);
            vm.$router.push('/');
          });
        }
      });
    }).catch((error) => {
      if (from.matched.length !== 0) {
        next(error);
      } else {
        next(vm => {
          Base.error(error, vm);
          vm.$router.push('/');
        });
      }
    });
  }

  */
};
</script>
