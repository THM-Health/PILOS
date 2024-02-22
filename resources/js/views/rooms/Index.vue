<template>
  <div class="container mt-3 mb-5">
    <!--  heading and option to add new rooms-->
    <div class="flex justify-content-between">
      <div>
        <h1 class="m-0">
          {{ $t('rooms.index.rooms') }}
        </h1>
      </div>
      <div v-if="userPermissions.can('create', 'RoomPolicy')" class="flex gap-2 flex-column">
        <RoomCreateComponent
          :disabled="limitReached"
          @limit-reached="onReachLimit"
        />
        <Tag v-if="showLimit" severity="info" class="w-full" >
          {{ $t('rooms.room_limit',{has:rooms.meta.total_own,max: authStore.currentUser.room_limit}) }}
        </Tag>
      </div>
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
        class="col-12 md:col-8 flex justify-content-end flex-column-reverse md:flex-row align-items-start gap-2"
      >
        <div class="flex justify-content-start gap-2">
          <!--button to open filter menu on small devices-->
          <Button
            class="block md:hidden"
            :severity="toggleMobileMenu?'primary':'secondary'"
            @click="toggleMobileMenu=!toggleMobileMenu"
            icon="fa-solid fa-filter"
            :label="$t('rooms.index.filter')"
          />

          <!--only favorites button-->
          <Button
            :severity="onlyShowFavorites?'primary':'secondary'"
            :disabled="loadingRooms"
            @click="onlyShowFavorites=!onlyShowFavorites; loadRooms(1);"
            icon="fa-solid fa-star"
            :label="$t('rooms.index.only_favorites')"
          />
        </div>
      </div>
    </div>

    <!--filter checkboxes (on small devices only shown, when filter menu is open)-->
    <div class="flex-column xl:flex-row gap-2 justify-content-between"
      :class="toggleMobileMenu?'flex':'hidden md:flex'"
    >
      <div class="flex flex-wrap gap-1">
        <ToggleButton
          v-model="roomFilterAll"
          @change="loadRooms(1)"
          v-if="!onlyShowFavorites"
          :on-label="$t('rooms.index.show_all')"
          :off-label="$t('rooms.index.show_all')"
        >
        </ToggleButton>
        <SelectButton
          v-if="!roomFilterAll && !onlyShowFavorites"
          v-model="roomFilter"
          :options="filterOptions"
          :disabled="onlyShowFavorites"
          optionLabel="name"
          optionValue="value"
          multiple
          @change="loadRooms(1)"
        />

      </div>
      <div class="flex flex-column md:flex-row align-items-start gap-2">
        <!-- room type select (on small devices only shown, when filter menu is open)-->
        <InputGroup v-if="!onlyShowFavorites">
          <InputGroupAddon>
            <i class="fa-solid fa-tag"></i>
          </InputGroupAddon>
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
            showClear
            optionLabel="description"
            optionValue="id"
          >
            <template #clearicon="{ clearCallback }">
              <Button
                @click.stop="clearCallback"
                severity="secondary"
                icon="fa-solid fa-times"
                text
                class="m-0"
              />
            </template>
          </Dropdown>
          <!-- reload the room types -->
          <Button
              v-if="roomTypesLoadingError"
              v-tooltip="$t('rooms.room_types.reload')"
              :disabled="roomTypesBusy||onlyShowFavorites"
              severity="secondary"
              outlined
              @click="loadRoomTypes"
              icon="fa-solid fa-sync"
              :loading="roomTypesBusy"
          />
        </InputGroup>

        <!--dropdown for sorting type (on small devices only shown, when filter menu is open)-->
        <InputGroup>
          <InputGroupAddon>
            <i class="fa-solid fa-sort"></i>
          </InputGroupAddon>
          <Dropdown
            v-model="selectedSortingType"
            @change="loadRooms(1)"
            :disabled="loadingRooms"
            :options="sortingTypes"
            optionLabel="label"
            optionValue="type"
          />
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
            <RoomCardSkeleton />
          </div>
        </div>
      </div>

      <!--rooms and pagination-->
      <div v-if="rooms">
        <div
          v-if="!loadingRooms && !loadingRoomsError"
          class="text-center"
        >
          <InlineMessage severity="info" v-if="onlyShowFavorites && rooms.meta.total_no_filter===0"> {{ $t('rooms.index.no_favorites') }} </InlineMessage>
          <InlineMessage severity="info" v-else-if="rooms.meta.total_no_filter===0">{{ $t('rooms.no_rooms_available') }}</InlineMessage>
          <InlineMessage severity="info" v-else-if="!rooms.data.length">{{ $t('rooms.no_rooms_found') }}</InlineMessage>
        </div>
        <div class="grid p-1">
          <div
            class="col-12 md:col-6 lg:col-4 p-2"
            v-for="room in rooms.data"
            :key="room.id"
          >
            <RoomCard
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
      <InlineMessage severity="error">{{ $t('rooms.index.no_rooms_selected') }}</InlineMessage>
      <br>
      <Button
        class="mt-2"
        ref="reset"
        @click="resetRoomFilter"
        :label="$t('rooms.index.reset_filter')"
      />
    </div>
  </div>
</template>

<script setup>

import { useAuthStore } from '@/stores/auth';
import { onMounted, ref, computed } from 'vue';
import { useApi } from '@/composables/useApi.js';
import { useI18n } from 'vue-i18n';
import { useUserPermissions } from '@/composables/useUserPermission.js';

const authStore = useAuthStore();
const api = useApi();
const { t } = useI18n();
const userPermissions = useUserPermissions();

const toggleMobileMenu = ref(false);
const loadingRooms = ref(false);
const loadingRoomsError = ref(false);
const rooms = ref(null);
const rawSearchQuery = ref('');

const roomFilter = ref(['own', 'shared']);
const roomFilterAll = ref(false);

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

// t('rooms.index.sorting.select_sorting')

const sortingTypes = computed(() => {
  return [
    {
      type: 'last_started',
      label: t('rooms.index.sorting.last_started')
    },
    {
      type: 'alpha',
      label: t('rooms.index.sorting.alpha')
    },
    {
      type: 'room_type',
      label: t('rooms.index.sorting.room_type')
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

const filterOptions = computed(() => {
  return [
    {
      name: t('rooms.index.show_own'),
      value: 'own'
    },
    {
      name: t('rooms.index.show_shared'),
      value: 'shared'
    },
    {
      name: t('rooms.index.show_public'),
      value: 'public'
    }
  ];
});

/**
     * Resets the room filters and reloads the rooms
     */
function resetRoomFilter () {
  roomFilter.value = ['own', 'shared'];
  roomFilterAll.value = false;
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
  if (roomFilter.value.length === 0 && roomFilterAll.value === false) {
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
      filter_own: roomFilter.value.includes('own') ? 1 : 0,
      filter_shared: roomFilter.value.includes('shared') ? 1 : 0,
      filter_public: roomFilter.value.includes('public') ? 1 : 0,
      filter_all: roomFilterAll.value ? 1 : 0,
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
