<template>
  <div class="container mt-3 mb-5">
    <!--  heading and option to add new rooms-->
    <div class="grid mb-3">
      <div class="col">
        <h1>
          {{ $t('rooms.index.rooms') }}
        </h1>
      </div>
      <can
        method="create"
        policy="RoomPolicy"
      >
        <div
          class="col-6 xl:col-3"
        >
          <NewRoomComponent
            :disabled="limitReached"
            @limit-reached="onReachLimit"
            class="mb-2"
          />
          <Tag v-if="showLimit" severity="info" class="w-full" >
            {{ $t('rooms.room_limit',{has:rooms.meta.total_own,max: authStore.currentUser.room_limit}) }}
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
            <small class="fa-solid fa-filter mr-2" /> {{ $t('rooms.index.filter') }}
          </Button>

          <!--only favorites button-->
          <Button
            :severity="onlyShowFavorites?'primary':'secondary'"
            :disabled="loadingRooms"
            class="ml-1"
            @click="onlyShowFavorites=!onlyShowFavorites; loadRooms(1);"
          >
            <small class="fa-solid fa-star mr-2" /> <span>{{ $t('rooms.index.only_favorites') }}</span>
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
            <label for="show-shared" class="ml-2">{{ $t('rooms.index.show_shared') }}</label>
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
            class="flex-grow-1 p-0"
            style="width: 1%"
          >
            <InlineMessage
              severity="error"
              class="w-full"
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
    <OverlayComponent
      v-if="!showNoFilterMessage"
      :show="loadingRooms || loadingRoomsError"
      :noCenter="true"
      z-index="3"
    >
      <template #overlay>
        <div class="text-center py-8">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl" v-if="loadingRooms"  />
          <Button
            v-else
            ref="reload"
            @click="reload()"
          >
            <i class="fa-solid fa-sync mr-2" /> {{ $t('app.reload') }}
          </Button>
        </div>
      </template>

      <!--show room skeleton if there is an error while no rooms are displayed-->
      <div v-if="(loadingRoomsError && (!rooms || rooms.data.length===0))">
        <div class="grid p-1">
          <div
            class="col-12 md:col-6 lg:col-4 p-2"
            v-for="i in 3"
            :key="i"
          >
            <RoomSkeletonComponent />
          </div>
        </div>
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
        <div class="grid p-1">
          <div
            class="col-12 md:col-6 lg:col-4 p-2"
            v-for="room in rooms.data"
            :key="room.id"
          >
            <room-card-component
              :room="room"
              @favorites-changed="loadRooms()"
            />
          </div>
        </div>
        <Paginator
          :alwaysShow="false"
          v-model="rooms.meta.current_page"
          class="mt-4"
          :totalRecords="rooms.meta.total"
          :rows="rooms.meta.per_page"
          :template="{
            '576px': 'FirstPageLink PrevPageLink NextPageLink LastPageLink',
            default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'
          }"
          :pt="{
            root: {
              class: 'bg-transparent'
            },
            pageButton: ({ props, state, context }) => ({
                class: context.active ? 'bg-primary' : undefined
            })
          }"
          @page="(event) => loadRooms(event.page+1)"
        />
      </div>
    </OverlayComponent>
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

<script setup>

import { useAuthStore } from '@/stores/auth';
import { onMounted, ref, reactive, computed } from 'vue';
import { useApi } from '@/composables/useApi.js';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const api = useApi();
const { t } = useI18n();

const toggleMobileMenu = ref(false);
const loadingRooms = ref(false);
const loadingRoomsError = ref(false);
const rooms = ref(null);
const rawSearchQuery = ref('');
const filter = reactive({
  own: true,
  shared: true,
  public: false,
  all: false
});
const showNoFilterMessage = ref(false);
const onlyShowFavorites = ref(false);
const selectedRoomType = ref(null);
const selectedSortingType = ref('last_started');
const roomTypes = ref([]);
const roomTypesBusy = ref(false);
const roomTypesLoadingError = ref(false);

const showLimit = computed(() => {
  return authStore.currentUser && authStore.currentUser.room_limit !== -1 && rooms.value !== null;
});

const limitReached = computed(() => {
  return authStore.currentUser && authStore.currentUser.room_limit !== -1 && rooms.value !== null && rooms.value.meta.total_own >= authStore.currentUser.room_limit;
});

const sortingTypes = computed(() => {
  return [
    {
      label: t('rooms.index.sorting.select_sorting'),
      items: [
        {
          label: t('rooms.index.sorting.last_started'),
          command: () => changeSortingOption('last_started')
        },
        {
          label: t('rooms.index.sorting.alpha'),
          command: () => changeSortingOption('alpha')
        },
        {
          label: t('rooms.index.sorting.room_type'),
          command: () => changeSortingOption('room_type')
        }
      ]
    }
  ];
});

onMounted(() => {
  reload();
});

/**
     * Handle event from new room component that the limit was reached
     */
function onReachLimit () {
  authStore.getCurrentUser();
  loadRooms();
}

/**
     * Loads the listed rooms
     * Change sorting type to the type that was selected in the dropdown
     * @param newOption
     */
function changeSortingOption (newOption) {
  selectedSortingType.value = newOption;
  loadRooms(1);
}

const sortingMenu = ref();
function toggleSortingMenu (event) {
  sortingMenu.value.toggle(event);
}

/**
     * Check all checkboxes if the checkbox for all rooms is checked
     */
function toggleCheckboxAll () {
  if (filter.all) {
    filter.own = true;
    filter.public = true;
    filter.shared = true;
  }
  loadRooms(1);
}

/**
     * Uncheck the checkbox for all rooms if one checkbox is unchecked
     * @param checked
     */
function toggleCheckbox (checked) {
  if (filter.all) {
    if (!checked) {
      filter.all = false;
    }
  }
  loadRooms(1);
}

/**
     * Resets the room filters and reloads the rooms
     */
function resetRoomFilter () {
  filter.own = true;
  filter.shared = true;
  selectedRoomType.value = null;
  loadRooms(1);
}

/**
     *  Reload rooms
     */
function reload () {
  loadRoomTypes();
  loadRooms();
}

/**
     * Load the room types
     */
function loadRoomTypes () {
  roomTypesBusy.value = true;

  api.call('roomTypes').then(response => {
    roomTypes.value = response.data.data;
    roomTypesLoadingError.value = false;
  }).catch(error => {
    roomTypesLoadingError.value = true;
    api.error(error);
  }).finally(() => {
    roomTypesBusy.value = false;
  });
}

/**
     * Load the rooms of the current user based on the given inputs
     */
function loadRooms (page = null) {
  console.log('page', page);
  if (filter.own === false && filter.shared === false && filter.public === false && filter.all === false) {
    showNoFilterMessage.value = true;
    return;
  }
  showNoFilterMessage.value = false;
  if (page === null) {
    page = rooms.value !== null ? rooms.value.meta.current_page : 1;
  }
  loadingRooms.value = true;

  api.call('rooms', {
    method: 'get',
    params: {
      filter_own: filter.own ? 1 : 0,
      filter_shared: filter.shared ? 1 : 0,
      filter_public: filter.public ? 1 : 0,
      filter_all: filter.all ? 1 : 0,
      only_favorites: onlyShowFavorites.value ? 1 : 0,
      room_type: selectedRoomType.value,
      sort_by: selectedSortingType.value,
      search: rawSearchQuery.value.trim() !== '' ? rawSearchQuery.value.trim() : null,
      page
    }
  }).then(response => {
    // operation successful, set rooms and reset loadingRoomsError
    rooms.value = response.data;
    loadingRoomsError.value = false;
    if (rooms.value.meta.current_page > 1 && rooms.value.data.length === 0) {
      loadRooms(rooms.value.meta.last_page);
    }
  }).catch(error => {
    // failed
    loadingRoomsError.value = true;
    api.error(error);
  }).finally(() => {
    loadingRooms.value = false;
  });
}

</script>
