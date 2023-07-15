<template>
    <b-container class="mt-3 mb-5">
      <b-row class="mb-1">
        <b-col md="9">
          <b-input-group>
            <b-form-input @change="loadRooms()" :disabled="loadingRooms" ref="search" :placeholder="$t('app.search')" v-model="rawSearchQuery"></b-form-input>
            <b-input-group-append>
              <b-button @click="loadRooms()" :disabled="loadingRooms" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.search')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
        <b-col md="3">
          <new-room-component @limitReached="onReachLimit" ></new-room-component>
        </b-col>
      </b-row>
      <b-row >
        <b-col md="3">
          <h6>{{ $t('rooms.index.sorting.sort') }}</h6>
          <b-form-select v-model="selectedSortingType" @change="loadRooms()">
            <b-form-select-option disabled value="-1">{{ $t('rooms.index.sorting.select_sorting') }}</b-form-select-option>
            <b-form-select-option value="alpha_asc">{{ $t('rooms.index.sorting.alpha_asc') }}</b-form-select-option>
            <b-form-select-option value="alpha_desc">{{ $t('rooms.index.sorting.alpha_desc') }}</b-form-select-option>
          </b-form-select>
        </b-col>
        <b-col md="3">
          <h6>{{ $t('rooms.index.room_type') }}</h6>
          <b-form-select v-model="selectedRoomType" @change="loadRooms()">
            <b-form-select-option disabled value="-1">{{ $t('rooms.room_types.select_type') }}</b-form-select-option>
            <b-form-select-option :value="null">Alle</b-form-select-option>
            <b-form-select-option v-for="roomType in roomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.description }}</b-form-select-option>
          </b-form-select>
        </b-col>
        <b-col md="3">
          <h6>{{ $t('rooms.index.show_shared') }}</h6>
          <b-form-checkbox
            switch
            v-model="showSharedRooms"
            @change="changedSharedRooms"
          >
          </b-form-checkbox>
        </b-col>
        <b-col md="3">
          <h6>{{ $t('rooms.index.show_all') }}</h6>
          <b-form-checkbox
            switch
            v-model="showAllRooms"
            @change="changedAllRooms"
          >
          </b-form-checkbox>
        </b-col>

      </b-row>
      <b-overlay :show="loadingRooms" >
        <div id="ownRooms" v-if="rooms">
<!--          ToDo update Badge and meta-->
          <b-badge v-if="showLimit">{{ $t('rooms.room_limit',{has:rooms.meta.total_no_filter,max:currentUser.room_limit}) }}</b-badge><br>
          <em v-if="rooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</em>
          <em v-else-if="!rooms.data.length">{{ $t('rooms.no_rooms_available_search') }}</em>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" >
            <b-col v-for="room in rooms.data" :key="room.id" class="pt-2">
                <room-component :id="room.id" :name="room.name" :owner="room.owner" :type="room.type" :meeting="room.last_meeting"></room-component>
            </b-col>

          </b-row>
          <b-pagination
            class="mt-4"
            v-if="rooms.meta.last_page != 1"
            v-model="rooms.meta.current_page"
            :total-rows="rooms.meta.total"
            :per-page="rooms.meta.per_page"
            @input="loadRooms(false)"
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
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null;
    },
    limitReached: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null && this.rooms.meta.total_no_filter >= this.currentUser.room_limit;
    }
  },
  mounted: function () {
    this.reload();
    this.loadRoomTypes();
  },
  methods: {

    ...mapActions(useAuthStore, ['getCurrentUser']),

    /**
     * Handle event from new room component that the limit was reached
     */
    onReachLimit () {
      this.getCurrentUser();
      this.loadRooms();
    },
    /**
     *  Reload rooms
     */
    reload () {
      this.loadRooms(false);
    },

    /**
     * Load the room types
     */
    loadRoomTypes () { //ToDo change so that the user has all options (or all necessary options)
      this.roomTypesBusy = true;

      let config;

      if (PermissionService.cannot('viewAll', 'RoomPolicy')) {
        config = {
          params: {
            filter: 'searchable' //Problem: only shows searchable RoomTypes (user can be member in a room that has another room type)
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
    /**
     * Load the rooms of the current user based on the given inputs
     * @param resetPage
     */
    loadRooms (resetPage = true) {
      //reset page of pagination if resetPage is true
      if (resetPage){
        this.rooms.meta.current_page = 1;
      }
      this.loadingRooms = true;
      //update the filter
      this.updateFilter();

      Base.call('rooms',{
        method: 'get',
        params: {
          filter:this.roomFilter,
          room_type: this.selectedRoomType,
          sort_by: this.selectedSortingType,
          search: this.rawSearchQuery.trim()!==""?this.rawSearchQuery.trim():null,
          page: this.rooms !== null ? this.rooms.meta.current_page : 1
        }
      }).then(response=>{
        //operation successful, set rooms
          this.rooms = response.data;
      }).catch(error => {
        //failed
        Base.error(error, this);
      }).finally(() => {
        this.loadingRooms = false;
      });

    },
    /**
     * changes showAllRooms if showSharedRooms was set to false
     */
    changedSharedRooms(){
      if (!this.showSharedRooms){
        this.showAllRooms = false;
      }
      this.loadRooms();
    },
    /**
     * changes showSharedRooms if showAllRooms was set to true
     */
    changedAllRooms(){
      if (this.showAllRooms){
        this.showSharedRooms= true;
      }
      this.loadRooms();
    },
    /**
     * updates the roomFilter based on showAllRooms and showSharedRooms
     */
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
      loadingRooms: false,
      rooms: null,
      rawSearchQuery: '',
      roomFilter:"own",
      selectedRoomType: null,
      selectedSortingType: "alpha_asc",
      showAllRooms: false,
      showSharedRooms: true,
      roomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false
    };
  }
};
</script>
