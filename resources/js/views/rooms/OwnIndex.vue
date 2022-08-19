<template>
    <b-container class="mt-3 mb-5">
      <b-row class="mb-3">
        <b-col md="3" offset-md="9">
          <b-input-group>
            <b-form-input @change="search" :disabled="loadingOwn || loadingShared" ref="search" :placeholder="$t('app.search')" v-model="rawSearchQuery"></b-form-input>
            <b-input-group-append>
              <b-button @click="search" :disabled="loadingOwn || loadingShared" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.toSearch')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
      </b-row>
      <h2>{{ $t('rooms.myRooms') }}</h2>
      <b-overlay :show="loadingOwn" >
        <div id="ownRooms" v-if="ownRooms">
          <b-badge v-if="showLimit">{{ $t('rooms.roomLimit',{has:ownRooms.meta.total_no_filter,max:currentUser.room_limit}) }}</b-badge><br>
          <em v-if="ownRooms.meta.total_no_filter===0">{{ $t('rooms.noRoomsAvailable') }}</em>
          <em v-else-if="!ownRooms.data.length">{{ $t('rooms.noRoomsAvailableSearch') }}</em>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3">
            <b-col v-for="room in ownRooms.data" :key="room.id" class="pt-2">
              <room-component :id="room.id" :name="room.name" :type="room.type"></room-component>
            </b-col>
            <can method="create" policy="RoomPolicy" v-if="!limitReached">
            <b-col class="pt-2">
              <new-room-component @limitReached="onReachLimit" ></new-room-component>
            </b-col>
            </can>
          </b-row>
          <b-pagination
            class="mt-4"
            v-if="ownRooms.meta.last_page != 1"
            v-model="ownRooms.meta.current_page"
            :total-rows="ownRooms.meta.total"
            :per-page="ownRooms.meta.per_page"
            @input="loadOwnRooms()"
          ></b-pagination>
        </div>
      </b-overlay>
      <hr>
      <h2>{{ $t('rooms.sharedRooms') }}</h2>
      <b-overlay :show="loadingShared" >
        <div id="sharedRooms" v-if="sharedRooms">
          <em v-if="sharedRooms.meta.total_no_filter===0">{{ $t('rooms.noRoomsAvailable') }}</em>
          <em v-else-if="!sharedRooms.data.length">{{ $t('rooms.noRoomsAvailableSearch') }}</em>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3">
            <b-col v-for="room in sharedRooms.data" :key="room.id" class="pt-2">
              <room-component :id="room.id" :name="room.name" v-bind:shared="true"  :shared-by="room.owner" :type="room.type"></room-component>
            </b-col>
          </b-row>
          <b-pagination
            class="mt-4"
            v-if="sharedRooms.meta.last_page != 1"
            v-model="sharedRooms.meta.current_page"
            :total-rows="sharedRooms.meta.total"
            :per-page="sharedRooms.meta.per_page"
            @input="loadSharedRooms()"
          ></b-pagination>
        </div>
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
      return this.currentUser && this.currentUser.room_limit !== -1 && this.ownRooms !== null;
    },
    limitReached: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.ownRooms !== null && this.ownRooms.meta.total_no_filter >= this.currentUser.room_limit;
    }
  },
  mounted: function () {
    this.reload();
  },
  methods: {
    // Handle event from new room component that the limit was reached
    onReachLimit () {
      store.dispatch('session/getCurrentUser');
      this.loadOwnRooms();
    },
    // Load all required resources
    reload () {
      this.loadOwnRooms();
      this.loadSharedRooms();
    },
    // Reset page of pagination and reload resources with search query
    search () {
      this.ownRooms.meta.current_page = 1;
      this.sharedRooms.meta.current_page = 1;
      this.loadOwnRooms();
      this.loadSharedRooms();
    },
    // Load the rooms shared with the current user
    loadSharedRooms () {
      this.loadingShared = true;

      const config = {
        params: {
          filter: 'shared',
          page: this.sharedRooms !== null ? this.sharedRooms.meta.current_page : 1
        }
      };

      if (this.rawSearchQuery.trim() !== '') {
        config.params.search = this.rawSearchQuery.trim();
      }

      Base.call('rooms', config).then(response => {
        this.sharedRooms = response.data;
      }).catch(error => {
        Base.error(error, this);
      }).finally(() => {
        this.loadingShared = false;
      });
    },
    // Load the rooms of the current user
    loadOwnRooms () {
      this.loadingOwn = true;

      const config = {
        params: {
          filter: 'own',
          page: this.ownRooms !== null ? this.ownRooms.meta.current_page : 1
        }
      };

      if (this.rawSearchQuery.trim() !== '') {
        config.params.search = this.rawSearchQuery.trim();
      }

      Base.call('rooms', config).then(response => {
        this.ownRooms = response.data;
      }).catch(error => {
        Base.error(error, this);
      }).finally(() => {
        this.loadingOwn = false;
      });
    }
  },
  data () {
    return {
      loadingOwn: false,
      loadingShared: false,
      ownRooms: null,
      sharedRooms: null,
      rawSearchQuery: ''
    };
  }
};
</script>
