<template>
    <b-container class="mt-3 mb-5">
<!--      heading and option to add new rooms-->
      <b-row class="mb-3">
        <b-col>
          <h2>
            {{$t('rooms.index.rooms')}}
          </h2>
        </b-col>
        <b-col sm='12' md='3' v-if="userCanCreateRooms">
            <new-room-component :disabled="limitReached" @limitReached="onReachLimit" ></new-room-component>
            <b-badge class="float-right w-100" v-if="showLimit">{{ $t('rooms.room_limit',{has:rooms.meta.total_own,max:currentUser.room_limit}) }}</b-badge>
        </b-col>
      </b-row>
      <hr>
<!--    search, sorting, favourite and option to show filter-->
      <b-row >
            <b-col md="4">
              <b-input-group class="mb-2">
                <b-form-input @change="loadRooms()" :disabled="loadingRooms" ref="search" :placeholder="$t('app.search')" v-model="rawSearchQuery"></b-form-input>
                <b-input-group-append>
                  <b-button @click="loadRooms()" :disabled="loadingRooms" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.search')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-col>
        <b-col md="8" class="text-right">

          <b-dropdown
            variant="secondary"
            class=" ml-1 mb-2"
            style="width: 14rem"
            menu-class="w-100"
            no-caret
          >
            <template #button-content>
              <small class="fa-solid fa-sort mr-1"></small>
              <span v-if="selectedSortingType==='last_active'">  {{ $t('rooms.index.sorting.last_active') }}</span>
              <span v-if="selectedSortingType==='alpha'">  {{ $t('rooms.index.sorting.alpha') }}</span>
              <span v-if="selectedSortingType==='room_type'">  {{ $t('rooms.index.sorting.room_type') }}</span>
              <small class="fa-solid fa-chevron-down ml-1"></small>
            </template>
            <b-dropdown-item disabled>{{ $t('rooms.index.sorting.select_sorting') }} </b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('last_active')"> {{ $t('rooms.index.sorting.last_active') }}</b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('alpha')"> {{ $t('rooms.index.sorting.alpha') }} </b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('room_type')"> {{ $t('rooms.index.sorting.room_type') }} </b-dropdown-item>
          </b-dropdown>

          <b-button @click="onlyShowFavourites=!onlyShowFavourites; loadRooms();" :variant="onlyShowFavourites?'primary':'secondary'" :disabled="showFilterOptions" class=" ml-1 mb-2">
            <small class="fa-solid fa-star"></small>
          </b-button>

          <b-button @click="showFilterOptions=!showFilterOptions" :disabled="onlyShowFavourites" :variant="showFilterOptions?'primary':'secondary'" class = " ml-1 mb-2">
            <small class="fa-solid fa-filter mr-1"></small>
            {{$t('rooms.index.filter')}}
            <small class="fa-solid" :class="{'fa-chevron-up': showFilterOptions, 'fa-chevron-down':!showFilterOptions }"></small>
          </b-button>

          <!--          <div class="float-right ml-1">-->
<!--            <b-form-select v-model="selectedSortingType" @change="loadRooms()" class="bg-secondary">-->
<!--              <b-form-select-option disabled value="-1">{{ $t('rooms.index.sorting.select_sorting') }} </b-form-select-option>-->
<!--              <b-form-select-option value="last_active">{{ $t('rooms.index.sorting.last_active') }}</b-form-select-option>-->
<!--              <b-form-select-option value="alpha">{{ $t('rooms.index.sorting.alpha') }}</b-form-select-option>-->
<!--              <b-form-select-option value="room_type">{{ $t('rooms.index.sorting.room_type') }}</b-form-select-option>-->
<!--            </b-form-select>-->
<!--          </div>-->

        </b-col>

      </b-row>
<!--      filter options-->
      <b-row v-if="showFilterOptions"  class="mb-2">
        <b-col md="9" class="d-flex align-items-center">
          <b-form-group class="mb-0 mt-0">
            <b-form-checkbox
              inline
              switch
              v-model="filter.own"
            >
              {{ $t('rooms.index.show_own') }}
            </b-form-checkbox>

            <b-form-checkbox
              inline
              switch
              v-model="filter.shared"
            >
              {{ $t('rooms.index.show_shared') }}
            </b-form-checkbox>

            <b-form-checkbox
              inline
              switch
              v-model="filter.public"
            >
              {{ $t('rooms.index.show_public') }}
            </b-form-checkbox>

            <b-form-checkbox
              v-if="userCanViewAll"
              inline
              switch
              v-model="filter.all"
            >
              {{ $t('rooms.index.show_all') }}
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col md="3" class="h-100">
          <b-form-select v-model="selectedRoomType" @change="loadRooms()" class="float-right">
            <b-form-select-option disabled value="-1">{{ $t('rooms.room_types.select_type') }}</b-form-select-option>
            <b-form-select-option :value="null">{{ $t('rooms.room_types.all') }}</b-form-select-option>
            <b-form-select-option v-for="roomType in roomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.description }}</b-form-select-option>
          </b-form-select>
        </b-col>
      </b-row>
      <b-overlay :show="loadingRooms" v-if="!showNoFilterMessage">
        <div v-if="rooms">
          <div class="text-center">
            <em v-if="rooms.meta.total_no_filter===0" >{{ $t('rooms.no_rooms_available') }}</em>
            <em v-else-if="!rooms.data.length" class="text-center">{{ $t('rooms.no_rooms_available_search') }}</em>
          </div>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" >
            <b-col v-for="room in rooms.data" :key="room.id" class="pt-2">
                <room-component :id="room.id" :name="room.name" :shortDescription="room.short_description" :favorite="room.favorite" :owner="room.owner" :type="room.type" :meeting="room.last_meeting"></room-component>
            </b-col>
          </b-row>

          <b-pagination
            class="mt-4"
            v-if="rooms.meta.last_page !== 1"
            v-model="rooms.meta.current_page"
            :total-rows="rooms.meta.total"
            :per-page="rooms.meta.per_page"
            @input="loadRooms(false)"
          ></b-pagination>
        </div>
      </b-overlay>
      <div v-else class="text-center">
        <em>{{ $t('rooms.index.no_rooms_selected') }}</em>
        <br>
        <b-button @click="filter.own=true; filter.shared=true; selectedRoomType=null;"> {{ $t('rooms.index.reset_filter') }}</b-button>
      </div>
    </b-container>
</template>

<script>

import RoomComponent from '../../components/Room/RoomComponent.vue';
import NewRoomComponent from '../../components/Room/NewRoomComponent.vue';
import Base from '../../api/base';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import PermissionService from '../../services/PermissionService';
import toast from "../../mixins/Toast";

export default {
  components: {
    RoomComponent,
    NewRoomComponent
  },
  computed: {

    ...mapState(useAuthStore, ['currentUser']),

    showLimit: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null;
    },
    limitReached: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null && this.rooms.meta.total_own >= this.currentUser.room_limit;
    }
  },
  mounted: function () {
    this.userCanCreateRooms = PermissionService.can('create', 'RoomPolicy');
    this.userCanViewAll = PermissionService.can('viewAll', 'RoomPolicy');
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

    changeSortingOption(newOption){
      this.selectedSortingType = newOption;
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
    loadRoomTypes () {
      this.roomTypesBusy = true;

      Base.call('roomTypes').then(response => {
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
      if (this.filter.own === false && this.filter.shared===false && this.filter.public=== false && this.filter.all===false){
        this.showNoFilterMessage = true;
        return;
      }
      this.showNoFilterMessage = false;
      // reset page of pagination if resetPage is true
      if (resetPage) {
        this.rooms.meta.current_page = 1;
      }
      this.loadingRooms = true;

      Base.call('rooms', {
        method: 'get',
        params: {
          filter_own: this.filter.own ? 1 : 0,
          filter_shared: this.filter.shared ? 1 : 0,
          filter_public: this.filter.public ? 1 : 0,
          filter_all: this.filter.all ? 1 : 0,
          room_type: this.selectedRoomType,
          sort_by: this.selectedSortingType,
          search: this.rawSearchQuery.trim() !== '' ? this.rawSearchQuery.trim() : null,
          page: this.rooms !== null ? this.rooms.meta.current_page : 1
        }
      }).then(response => {
        // operation successful, set rooms
        this.rooms = response.data;
      }).catch(error => {
        // failed
        Base.error(error, this);
      }).finally(() => {
        this.loadingRooms = false;
      });
    },

  },
  data () {
    return {
      loadingRooms: false,
      rooms: null,
      rawSearchQuery: '',
      filter: {
        own: true,
        shared: true,
        public: false,
        all: false
      },
      showFilterOptions: false,
      showNoFilterMessage:false,
      onlyShowFavourites:false,
      selectedRoomType: null,
      selectedSortingType: 'last_active',
      roomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false,
      userCanCreateRooms: false,
      userCanViewAll: false
    };
  },
  watch: {
    filter: {
      handler: function () {
        this.loadRooms(true);
      },
      deep: true
    }
  }
};
</script>
