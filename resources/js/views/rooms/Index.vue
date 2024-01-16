<template>
  <div class="container mt-3 mb-5">
    <!--  heading and option to add new rooms-->
    <div class="grid mb-3">
      <div class="col">
        <h2>
          {{ $t('rooms.index.rooms') }}
        </h2>
      </div>
      <can
        method="create"
        policy="RoomPolicy"
      >
        <div
          class="col-6 xl:col-3"
        >
          <new-room-component
            :disabled="limitReached"
            @limit-reached="onReachLimit"
          />
          <Tag v-if="showLimit" severity="info" class="w-full" >
            {{ $t('rooms.room_limit',{has:rooms.meta.total_own,max:currentUser.room_limit}) }}
          </Tag>
        </div>
      </can>
    </div>
    <Divider />

    <!--  search, sorting, favorite-->
    <div class="grid">
      <div class="col-12 md:col-4">
        <!--search-->
        <InputGroup class="mb-2">
          <InputText
            ref="search"
            v-model="rawSearchQuery"
            :disabled="loadingRooms"
            :placeholder="$t('app.search')"
            @change="loadRooms(1)"
          />
          <Button
            icon="fa-solid fa-magnifying-glass"
            @click="loadRooms(1)"
            :disabled="loadingRooms"
            v-tooltip="$t('app.search')"
          />
        </InputGroup>
      </div>
      <div
        class="col-12 md:col-8 flex justify-content-end flex-column-reverse md:flex-row"
      >
        <!--dropdown for sorting type (on small devices only shown, when filter menu is open)-->
        <Button
          severity="secondary"
          class="mb-2"
          :class="toggleMobileMenu?'':'hidden md:flex'"
          style="width: 14rem"
          type="button"
          :disabled="loadingRooms"
          @click="toggleSortingMenu"
          aria-haspopup="true"
          aria-controls="select_sorting_menu"
        >
          <div class="w-full flex justify-content-between">
            <div>
              <small class="fa-solid fa-sort mr-2" />
              <span v-if="selectedSortingType==='last_started'">  {{ $t('rooms.index.sorting.last_started') }}</span>
              <span v-if="selectedSortingType==='alpha'">  {{ $t('rooms.index.sorting.alpha') }}</span>
              <span v-if="selectedSortingType==='room_type'">  {{ $t('rooms.index.sorting.room_type') }}</span>
            </div>
            <div>
              <small class="fa-solid fa-caret-down ml-2" />
            </div>
          </div>
        </Button>
        <Menu
          ref="sortingMenu"
          id="select_sorting_menu"
          :model="sortingTypes"
          :popup="true"
          @focus="() => $nextTick(() => { $refs.sortingMenu.focusedOptionIndex = -1; } )"
        />

        <div class="flex justify-content-start mb-2">
          <!--button to open filter menu on small devices-->
          <Button
            class="block md:hidden"
            :severity="toggleMobileMenu?'primary':'secondary'"
            @click="toggleMobileMenu=!toggleMobileMenu"
          >
            <small class="fa-solid fa-filter" /> {{ $t('rooms.index.filter') }}
          </Button>

          <!--only favorites button-->
          <Button
            :severity="onlyShowFavorites?'primary':'secondary'"
            :disabled="loadingRooms"
            class="ml-1"
            @click="onlyShowFavorites=!onlyShowFavorites; loadRooms(1);"
          >
            <small class="fa-solid fa-star" /> <span>{{ $t('rooms.index.only_favorites') }}</span>
          </Button>
        </div>
      </div>
    </div>

    <!--filter checkboxes (on small devices only shown, when filter menu is open)-->
    <div class="grid mb-2"
      :class="toggleMobileMenu?'':'hidden md:flex'"
    >
      <div
        class="col-12 md:col-8 flex align-items-center gap-3 mb-2 mt-2"
      >
          <div class="flex align-items-center">
            <InputSwitch
              v-model="filter.own"
              @input="toggleCheckbox"
              :disabled="loadingRooms || onlyShowFavorites"
              inputId="show-own"
            />
            <label for="show-own" class="ml-2">{{ $t('rooms.index.show_own') }}</label>
          </div>

          <div class="flex align-items-center">
            <InputSwitch
              v-model="filter.shared"
              @input="toggleCheckbox"
              :disabled="loadingRooms || onlyShowFavorites"
              inputId="show-shared"
            />
            <label for="show-shared" class="ml-2">{{ $t('rooms.index.show_own') }}</label>
          </div>

        <div class="flex align-items-center">
            <InputSwitch
              v-model="filter.public"
              @input="toggleCheckbox"
              :disabled="loadingRooms || onlyShowFavorites"
              inputId="show-public"
            />
          <label for="show-public" class="ml-2">{{ $t('rooms.index.show_public') }}</label>
        </div>

          <can
            method="viewAll"
            policy="RoomPolicy"
          >
            <div class="flex align-items-center">
              <InputSwitch
                v-model="filter.all"
                @input="toggleCheckboxAll"
                :disabled="loadingRooms || onlyShowFavorites"
                inputId="show-all"
              />
              <label for="show-all" class="ml-2">{{ $t('rooms.index.show_all') }}</label>
            </div>
          </can>
      </div>
      <div
        class="col-12 md:col-4 h-100"
      >
        <!-- room type select (on small devices only shown, when filter menu is open)-->
        <InputGroup>
          <InputGroupAddon
            v-if="roomTypesLoadingError"
            class="flex-grow-1"
            style="width: 1%"
          >
            <InlineMessage
              severity="error"
              class="mb-0 w-100"
            >
              {{ $t('rooms.room_types.loading_error') }}
            </InlineMessage>
          </InputGroupAddon>
          <Dropdown
            v-else
            v-model="selectedRoomType"
            :disabled="loadingRooms||roomTypesBusy||onlyShowFavorites"
            @change="loadRooms(1)"
            :placeholder="$t('rooms.room_types.all')"
            :options="roomTypes"
            optionLabel="description"
            optionValue="id"
          />
          <Button
            v-if="selectedRoomType"
            severity="secondary"
            outlined
            @click="selectedRoomType = null;
            loadRooms(1)"
          >
            <i class="fa-solid fa-times" />
          </Button>
          <!-- reload the room types -->
          <Button
              v-tooltip="$t('rooms.room_types.reload')"
              :disabled="roomTypesBusy||onlyShowFavorites"
              severity="secondary"
              outlined
              @click="loadRoomTypes"
            >
              <i
                class="fa-solid fa-sync"
                :class="{ 'fa-spin': roomTypesBusy }"
              />
          </Button>
        </InputGroup>
      </div>
    </div>

    <!--rooms overlay-->
    <b-overlay
      v-if="!showNoFilterMessage"
      :show="loadingRooms || loadingRoomsError"
      no-center
    >
      <template #overlay>
        <div class="text-center mt-5">
          <b-spinner v-if="loadingRooms" />
          <b-button
            v-else
            ref="reload"
            @click="reload()"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <!--show room skeleton if there is an error while no rooms are displayed-->
      <div v-if="(loadingRoomsError && (!rooms || rooms.data.length===0))">
        <b-row
          cols="1"
          cols-sm="2"
          cols-md="2"
          cols-lg="3"
        >
          <b-col
            v-for="i in 3"
            :key="i"
          >
            <RoomSkeletonComponent />
          </b-col>
        </b-row>
      </div>

      <!--rooms and pagination-->
      <div v-if="rooms">
        <div
          v-if="!loadingRooms && !loadingRoomsError"
          class="text-center mt-3"
        >
          <em v-if="onlyShowFavorites && rooms.meta.total_no_filter===0"> {{ $t('rooms.index.no_favorites') }} </em>
          <em v-else-if="rooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</em>
          <em v-else-if="!rooms.data.length">{{ $t('rooms.no_rooms_found') }}</em>
        </div>
        <b-row
          cols="1"
          cols-sm="2"
          cols-md="2"
          cols-lg="3"
          class="p-1"
        >
          <b-col
            v-for="room in rooms.data"
            :key="room.id"
            class="p-2"
          >
            <room-card-component
              :room="room"
              @favorites-changed="loadRooms()"
            />
          </b-col>
        </b-row>
        <b-pagination
          v-if="rooms.meta.last_page !== 1"
          v-model="rooms.meta.current_page"
          class="mt-4"
          :total-rows="rooms.meta.total"
          :per-page="rooms.meta.per_page"
          @change="loadRooms"
        />
      </div>
    </b-overlay>
    <div
      v-else
      class="text-center mt-3"
    >
      <em>{{ $t('rooms.index.no_rooms_selected') }}</em>
      <br>
      <b-button
        ref="reset"
        @click="resetRoomFilter"
      >
        {{ $t('rooms.index.reset_filter') }}
      </b-button>
    </div>
  </div>
</template>

<script>

import RoomCardComponent from '@/components/Room/RoomCardComponent.vue';
import NewRoomComponent from '@/components/Room/NewRoomComponent.vue';
import Base from '@/api/base';
import { mapActions, mapState } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import RoomSkeletonComponent from '@/components/Room/RoomSkeletonComponent.vue';
import Can from '@/components/Permissions/Can.vue';

export default {
  components: {
    RoomSkeletonComponent,
    RoomCardComponent,
    NewRoomComponent,
    Can
  },
  computed: {

    ...mapState(useAuthStore, ['currentUser']),

    showLimit: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null;
    },
    limitReached: function () {
      return this.currentUser && this.currentUser.room_limit !== -1 && this.rooms !== null && this.rooms.meta.total_own >= this.currentUser.room_limit;
    },

    sortingTypes: function () {
      return [
        {
          label: this.$t('rooms.index.sorting.select_sorting'),
          items: [
            {
              label: this.$t('rooms.index.sorting.last_started'),
              command: () => this.changeSortingOption('last_started')
            },
            {
              label: this.$t('rooms.index.sorting.alpha'),
              command: () => this.changeSortingOption('alpha')
            },
            {
              label: this.$t('rooms.index.sorting.room_type'),
              command: () => this.changeSortingOption('room_type')
            }
          ]
        }
      ];
    },

    roomTypeSelectItems: function () {
      return [
        {
          label: this.$t('rooms.room_types.all'),
          value: null
        },
        ...this.roomTypes.map(roomType => {
          return {
            label: roomType.description,
            value: roomType.id
          };
        })
      ];
    }
  },
  mounted: function () {
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
     * Loads the listed rooms
     * Change sorting type to the type that was selected in the dropdown
     * @param newOption
     */
    changeSortingOption (newOption) {
      this.selectedSortingType = newOption;
      this.loadRooms(1);
    },

    toggleSortingMenu (event) {
      this.$refs.sortingMenu.toggle(event);
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
      showNoFilterMessage: false,
      onlyShowFavorites: false,
      selectedRoomType: null,
      selectedSortingType: 'last_started',
      roomTypes: [],
      roomTypesBusy: false,
      roomTypesLoadingError: false
    };
  },
  watch: {

  }
};
</script>
