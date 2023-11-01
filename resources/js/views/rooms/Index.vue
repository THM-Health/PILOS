<template>
    <b-container class="mt-3 mb-5">
<!--  heading and option to add new rooms-->
      <b-row class="mb-3">
        <b-col>
          <h2>
            {{$t('rooms.index.rooms')}}
          </h2>
        </b-col>
        <b-col col='6' md='6' xl="3" v-if="userCanCreateRooms">
            <new-room-component :disabled="limitReached" @limitReached="onReachLimit" ></new-room-component>
            <b-badge ref="room-limit" class="float-right w-100" v-if="showLimit">{{ $t('rooms.room_limit',{has:rooms.meta.total_own,max:currentUser.room_limit}) }}</b-badge>
        </b-col>
      </b-row>
      <hr>
<!--  search, sorting, favorite and option to show filter-->
      <b-row >
        <b-col md="4">
          <b-input-group class="mb-2">
            <b-form-input @change="loadRooms(1)" :disabled="loadingRooms" ref="search" :placeholder="$t('app.search')" v-model="rawSearchQuery"></b-form-input>
            <b-input-group-append>
              <b-button @click="loadRooms(1)" :disabled="loadingRooms" variant="primary" v-tooltip-hide-click v-b-tooltip.hover :title="$t('app.search')"><i class="fa-solid fa-magnifying-glass"></i></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
        <b-col md="8" class="d-flex justify-content-end flex-column-reverse flex-md-row ">
          <b-dropdown
            :disabled="loadingRooms"
            variant="secondary"
            class="mb-2"
            :class="toggleMobileMenu?'':'d-none d-md-flex'"
            style="width: 14rem"
            menu-class="w-100"
            no-caret
          >
            <template #button-content>
              <div class="d-flex justify-content-between">
                <div>
                  <small class="fa-solid fa-sort mr-1"></small>
                  <span v-if="selectedSortingType==='last_started'">  {{ $t('rooms.index.sorting.last_started') }}</span>
                  <span v-if="selectedSortingType==='alpha'">  {{ $t('rooms.index.sorting.alpha') }}</span>
                  <span v-if="selectedSortingType==='room_type'">  {{ $t('rooms.index.sorting.room_type') }}</span>
                </div>
                <div>
                  <small class="fa-solid fa-chevron-down ml-1"></small>
                </div>
              </div>
            </template>
            <b-dropdown-item disabled>{{ $t('rooms.index.sorting.select_sorting') }} </b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('last_started')"> {{ $t('rooms.index.sorting.last_started') }}</b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('alpha')"> {{ $t('rooms.index.sorting.alpha') }} </b-dropdown-item>
            <b-dropdown-item @click="changeSortingOption('room_type')"> {{ $t('rooms.index.sorting.room_type') }} </b-dropdown-item>
          </b-dropdown>

          <div class="d-flex justify-content-start mb-2">
            <b-button
              class="d-block d-md-none"
              @click="toggleMobileMenu=!toggleMobileMenu"
              :variant="toggleMobileMenu?'primary':'secondary'"
            >
              <small class="fa-solid fa-filter"></small> {{ $t('rooms.index.filter') }}
            </b-button>
            <b-button @click="onlyShowFavorites=!onlyShowFavorites; loadRooms(1);" :variant="onlyShowFavorites?'primary':'secondary'" :disabled="showFilterOptions||loadingRooms" class="ml-1">
              <small class="fa-solid fa-star"></small> <span>{{ $t('rooms.index.only_favorites') }}</span>
            </b-button>
          </div>
        </b-col>

      </b-row>

<!--  filter options-->
      <b-row class="mb-2" :class="toggleMobileMenu?'':'d-none d-md-flex'">
        <b-col md="9" class="d-flex align-items-center">
          <b-form-group class="mb-2 mt-2" :disabled="loadingRooms">
            <b-form-checkbox
              inline
              switch
              @change="toggleCheckbox"
              v-model="filter.own"
              :disabled="onlyShowFavorites"
            >
              {{ $t('rooms.index.show_own') }}
            </b-form-checkbox>

            <b-form-checkbox
              inline
              switch
              @change="toggleCheckbox"
              v-model="filter.shared"
              :disabled="onlyShowFavorites"
            >
              {{ $t('rooms.index.show_shared') }}
            </b-form-checkbox>

            <b-form-checkbox
              inline
              switch
              v-model="filter.public"
              @change="toggleCheckbox"
              :disabled="onlyShowFavorites"
            >
              {{ $t('rooms.index.show_public') }}
            </b-form-checkbox>

            <b-form-checkbox
              v-if="userCanViewAll"
              inline
              switch
              @change="toggleCheckboxAll"
              v-model="filter.all"
              :disabled="onlyShowFavorites"
            >
              {{ $t('rooms.index.show_all') }}
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col md="3" class="h-100">
          <b-input-group >
            <b-input-group-prepend class="flex-grow-1" style="width: 1%" v-if="roomTypesLoadingError" >
              <b-alert class="mb-0 w-100" show variant="danger">{{ $t('rooms.room_types.loading_error') }}</b-alert>
            </b-input-group-prepend>
            <b-form-select v-else v-model="selectedRoomType" @change="loadRooms(1)" class="float-right" :disabled="loadingRooms||roomTypesBusy||onlyShowFavorites">
              <b-form-select-option disabled value="-1">{{ $t('rooms.room_types.select_type') }}</b-form-select-option>
              <b-form-select-option :value="null">{{ $t('rooms.room_types.all') }}</b-form-select-option>
              <b-form-select-option v-for="roomType in roomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.description }}</b-form-select-option>
            </b-form-select>
            <b-input-group-append>
              <!-- Reload the room types -->
              <b-button
                @click="loadRoomTypes"
                :disabled="roomTypesBusy||onlyShowFavorites"
                variant="outline-secondary"
                :title="$t('rooms.room_types.reload')"
                v-b-tooltip.hover
                v-tooltip-hide-click
              ><i class="fa-solid fa-sync"  v-bind:class="{ 'fa-spin': roomTypesBusy  }"></i
              ></b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
      </b-row>

<!--  rooms-->
      <b-overlay :show="loadingRooms || loadingRoomsError" v-if="!showNoFilterMessage" no-center>
        <template #overlay>
          <div class="text-center mt-5" >
            <b-spinner v-if="loadingRooms" ></b-spinner>
            <b-button
              ref="reload"
              v-else
              @click="reload()"
            >
              <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
            </b-button>
          </div>
        </template>

        <!--show room skeleton if there is an error while no rooms are displayed-->
        <div v-if="(loadingRoomsError && (!rooms || rooms.data.length===0))">
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" >
            <b-col v-for="i in 3" :key="i">
              <RoomSkeletonComponent></RoomSkeletonComponent>
            </b-col>
          </b-row>
        </div>

        <div v-if="rooms">
          <div v-if="!loadingRooms && !loadingRoomsError" class="text-center mt-3">
            <em v-if="onlyShowFavorites && rooms.meta.total_no_filter===0"> {{$t('rooms.index.no_favorites')}} </em>
            <em v-else-if="rooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</em>
            <em v-else-if="!rooms.data.length">{{ $t('rooms.no_rooms_available_search') }}</em>
          </div>
          <b-row cols="1" cols-sm="2" cols-md="2" cols-lg="3" >
            <b-col v-for="room in rooms.data" :key="room.id" class="pt-2">
                <room-component @favorites_changed="loadRooms()" :id="room.id" :name="room.name" :shortDescription="room.short_description" :isFavorite="room.is_favorite" :owner="room.owner" :type="room.type" :meeting="room.last_meeting"></room-component>
            </b-col>
          </b-row>
          <b-pagination
            class="mt-4"
            v-if="rooms.meta.last_page !== 1"
            v-model="rooms.meta.current_page"
            :total-rows="rooms.meta.total"
            :per-page="rooms.meta.per_page"
            @change="loadRooms"
          ></b-pagination>
        </div>
      </b-overlay>
      <div v-else class="text-center mt-3">
        <em>{{ $t('rooms.index.no_rooms_selected') }}</em>
        <br>
        <b-button ref="reset" @click="resetRoomFilter"> {{ $t('rooms.index.reset_filter') }}</b-button>
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
import RoomSkeletonComponent from '../../components/Room/RoomSkeletonComponent.vue';

export default {
  components: {
    RoomSkeletonComponent,
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
     * Change sorting type to the type that was selected in the dropdown
     * @param newOption
     */
    changeSortingOption (newOption) {
      this.selectedSortingType = newOption;
      this.loadRooms(1);
    },

    /**
     * Check all checkboxes if the checkbox for all rooms is checked
     */
    toggleCheckboxAll () {
      if (this.filter.all) {
        this.filter.own = true;
        this.filter.public = true;
        this.filter.shared = true;
      }
      this.loadRooms(1);
    },

    /**
     * Uncheck the checkbox for all rooms if one checkbox is unchecked
     * @param checked
     */
    toggleCheckbox (checked) {
      if (this.filter.all) {
        if (!checked) {
          this.filter.all = false;
        }
      }
      this.loadRooms(1);
    },
    /**
     * Resets the room filters and reloads the rooms
     */
    resetRoomFilter () {
      this.filter.own = true;
      this.filter.shared = true;
      this.selectedRoomType = null;
      this.loadRooms(1);
    },
    /**
     *  Reload rooms
     */
    reload () {
      this.loadRoomTypes();
      this.loadRooms();
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
     * @param page
     */
    loadRooms (page = null) {
      if (this.filter.own === false && this.filter.shared === false && this.filter.public === false && this.filter.all === false) {
        this.showNoFilterMessage = true;
        return;
      }
      this.showNoFilterMessage = false;
      if (page === null) {
        page = this.rooms !== null ? this.rooms.meta.current_page : 1;
      }
      this.loadingRooms = true;

      Base.call('rooms', {
        method: 'get',
        params: {
          filter_own: this.filter.own ? 1 : 0,
          filter_shared: this.filter.shared ? 1 : 0,
          filter_public: this.filter.public ? 1 : 0,
          filter_all: this.filter.all ? 1 : 0,
          only_favorites: this.onlyShowFavorites ? 1 : 0,
          room_type: this.selectedRoomType,
          sort_by: this.selectedSortingType,
          search: this.rawSearchQuery.trim() !== '' ? this.rawSearchQuery.trim() : null,
          page
        }
      }).then(response => {
        // operation successful, set rooms and reset loadingRoomsError
        this.rooms = response.data;
        this.loadingRoomsError = false;
        if (this.rooms.meta.current_page > 1 && this.rooms.data.length === 0) {
          this.loadRooms(this.rooms.meta.last_page);
        }
      }).catch(error => {
        // failed
        this.loadingRoomsError = true;
        Base.error(error, this);
      }).finally(() => {
        this.loadingRooms = false;
      });
    }

  },
  data () {
    return {
      toggleMobileMenu: false,
      loadingRooms: false,
      loadingRoomsError: false,
      rooms: null,
      rawSearchQuery: '',
      filter: {
        own: true,
        shared: true,
        public: false,
        all: false
      },
      showFilterOptions: false,
      showNoFilterMessage: false,
      onlyShowFavorites: false,
      selectedRoomType: null,
      selectedSortingType: 'last_started',
      roomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false,
      userCanCreateRooms: false,
      userCanViewAll: false
    };
  },
  watch: {

  }
};
</script>
