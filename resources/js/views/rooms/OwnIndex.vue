<template>
    <b-container class="mt-3 mb-5">
      <b-row class="mb-1">
        <b-col md="9">
          <b-input-group>
            <b-form-input @change="search" :disabled="loadingOwn || loadingShared" ref="search" :placeholder="$t('app.search')" v-model="rawSearchQuery"></b-form-input>
            <b-input-group-append>
              <b-button @click="search" :disabled="loadingOwn || loadingShared" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.search')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
        <b-col md="3">
          <new-room-component @limitReached="onReachLimit" ></new-room-component>
        </b-col>
      </b-row>
      <b-row >
        <b-col md="3">
          <h6>Sortierung</h6>
          <b-form-select v-model="selectedSortingType" @change="loadOwnRooms()">
            <b-form-select-option disabled value="-1">-- Sortierung auswählen --</b-form-select-option>
            <b-form-select-option value="alpha_asc">Alphabetisch aufsteigend</b-form-select-option>
            <b-form-select-option value="alpha_desc">Alphabetisch absteigend</b-form-select-option>
            <b-form-select-option value="...">...</b-form-select-option>
          </b-form-select>
        </b-col>
        <b-col md="3">
          <h6>Raumart</h6>
          <b-form-select v-model="selectedRoomType" @change="loadOwnRooms()">
            <b-form-select-option disabled value="-1">{{ $t('rooms.room_types.select_type') }}</b-form-select-option>
            <b-form-select-option :value="null">Alle</b-form-select-option>
            <b-form-select-option v-for="roomType in roomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.description }}</b-form-select-option>
          </b-form-select>
        </b-col>
        <b-col md="3">
          <h6>Geteilte Räume anzeigen</h6>
          <b-form-checkbox
            switch
            v-model="showSharedRooms"
            @change="changedSharedRooms"
          >
          </b-form-checkbox>
        </b-col>
        <b-col md="3">
          <h6>Alle Räume anzeigen</h6>
          <b-form-checkbox
            switch
            v-model="showAllRooms"
            @change="changedAllRooms"
          >
          </b-form-checkbox>
        </b-col>

      </b-row>
      <b-overlay :show="loadingOwn" >
        <div id="ownRooms" v-if="ownRooms">
          <b-badge v-if="showLimit">{{ $t('rooms.room_limit',{has:ownRooms.meta.total_no_filter,max:currentUser.room_limit}) }}</b-badge><br>
          <em v-if="ownRooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</em>
          <em v-else-if="!ownRooms.data.length">{{ $t('rooms.no_rooms_available_search') }}</em>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" >
            <b-col v-for="room in ownRooms.data" :key="room.id" class="pt-2">
                <room-component :id="room.id" :name="room.name" :owner="room.owner" :type="room.type" :meeting="room.last_meeting"></room-component>
            </b-col>
<!--            <can method="create" policy="RoomPolicy" v-if="!limitReached">
            <b-col class="pt-2">
              <new-room-component @limitReached="onReachLimit" ></new-room-component>
            </b-col>
            </can>-->
          </b-row>
          <b-pagination
            class="mt-4"
            v-if="ownRooms.meta.last_page != 1"
            v-model="ownRooms.meta.current_page"
            :total-rows="ownRooms.meta.total"
            :per-page="ownRooms.meta.per_page"
            @input="loadOwnRooms(false)"
          ></b-pagination>
        </div>
      </b-overlay>
      <hr>
      <h2>{{ $t('rooms.shared_rooms') }}</h2>
      <b-overlay :show="loadingShared" >
        <div id="sharedRooms" v-if="sharedRooms">
          <em v-if="sharedRooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</em>
          <em v-else-if="!sharedRooms.data.length">{{ $t('rooms.no_rooms_available_search') }}</em>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3">
            <b-col v-for="room in sharedRooms.data" :key="room.id" class="pt-2">
              <room-component :id="room.id" :name="room.name" v-bind:shared="true" :meeting="room.last_meeting" :owner="room.owner" :type="room.type"></room-component>
            </b-col>
          </b-row>
          <b-pagination
            class="mt-4"
            v-if="sharedRooms.meta.last_page !== 1"
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
import Can from '../../components/Permissions/Can.vue';
import Base from '../../api/base';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import PermissionService from "../../services/PermissionService";

export default {
  components: {
    RoomComponent,
    NewRoomComponent,
    Can
  },
  computed: {

    ...mapState(useAuthStore, ['currentUser']),

    showLimit: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.ownRooms !== null;
    },
    limitReached: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.ownRooms !== null && this.ownRooms.meta.total_no_filter >= this.currentUser.room_limit;
    }
  },
  mounted: function () {
    this.reload();
    this.loadRoomTypes();
  },
  methods: {

    ...mapActions(useAuthStore, ['getCurrentUser']),

    // Handle event from new room component that the limit was reached
    onReachLimit () {
      this.getCurrentUser();
      this.loadOwnRooms();
    },
    // Load all required resources
    reload () {
      this.loadOwnRooms(false);
      this.loadSharedRooms();
    },
    // Reset page of pagination and reload resources with search query
    search () {
      this.ownRooms.meta.current_page = 1;
      // this.sharedRooms.meta.current_page = 1;
      this.loadOwnRooms();
      // this.loadSharedRooms();
    },
    /**
     * Load the room types
     */
    loadRoomTypes () {
      this.roomTypesBusy = true;

      let config;

      if (PermissionService.cannot('viewAll', 'RoomPolicy')) {
        config = {
          params: {
            filter: 'searchable'
          }
        };
      }

      Base.call('roomTypes', config).then(response => {
        this.roomTypes = response.data.data;
        this.roomTypesLoadingError = false;
      }).catch(error => {
        this.roomTypesLoadingError = true;
        Base.error(error, this);
      }).finally(() => {
        this.roomTypesBusy = false;
      });
    },
    // Load the rooms shared with the current user
    loadSharedRooms () {
      // this.loadingShared = true;
      //
      // const config = {
      //   params: {
      //     filter: 'shared',
      //     page: this.sharedRooms !== null ? this.sharedRooms.meta.current_page : 1
      //   }
      // };
      //
      // if (this.rawSearchQuery.trim() !== '') {
      //   config.params.search = this.rawSearchQuery.trim();
      // }
      //
      // Base.call('rooms', config).then(response => {
      //   this.sharedRooms = response.data;
      // }).catch(error => {
      //   Base.error(error, this);
      // }).finally(() => {
      //   this.loadingShared = false;
      // });
    },
    // Load the rooms of the current user
    loadOwnRooms (resetPage = true) {
      if (resetPage){
        this.ownRooms.meta.current_page = 1;
      }
      this.loadingOwn = true;
      this.updateFilter();

      Base.call('rooms',{
        method: 'get',
        params: {
          filter:this.roomFilter,
          room_type: this.selectedRoomType,
          sort_by: this.selectedSortingType,
          search: this.rawSearchQuery.trim()!==""?this.rawSearchQuery.trim():null,
          page: this.ownRooms !== null ? this.ownRooms.meta.current_page : 1
        }
      }).then(response=>{
          this.ownRooms = response.data;
      }).catch(error => {
        Base.error(error, this);
      }).finally(() => {
        this.loadingOwn = false;
      });

      // const config = {
      //   params: {
      //     filter: 'own',
      //     page: this.ownRooms !== null ? this.ownRooms.meta.current_page : 1
      //   }
      // };
      //
      // if (this.rawSearchQuery.trim() !== '') {
      //   config.params.search = this.rawSearchQuery.trim();
      // }
      //
      // Base.call('rooms', config).then(response => {
      //   this.ownRooms = response.data;
      // }).catch(error => {
      //   Base.error(error, this);
      // }).finally(() => {
      //   this.loadingOwn = false;
      // });
    },
    changedSharedRooms(){
      if (!this.showSharedRooms){
        this.showAllRooms = false;
      }
      this.loadOwnRooms();
    },
    changedAllRooms(){
      if (this.showAllRooms){
        this.showSharedRooms= true;
      }
      this.loadOwnRooms();
    },
    updateFilter(){
      if (this.showAllRooms){
        this.roomFilter="all";
      }
      else if (this.showSharedRooms && !this.showAllRooms){
        this.roomFilter="own_and_shared";
      }
      else {
        this.roomFilter="own";
      }
    }
  },
  data () {
    return {
      loadingOwn: false,
      loadingShared: false,
      ownRooms: null,
      sharedRooms: null,
      rawSearchQuery: '',
      roomFilter:"own",
      selectedRoomType: null,
      selectedSortingType: "alpha_asc",
      showAllRooms: false,
      showSharedRooms: false,
      roomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false
    };
  }
};
</script>
