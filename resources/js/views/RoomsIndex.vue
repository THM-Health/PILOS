<template>
  <div class="container mt-3 mb-5">
    <!--  heading and option to add new rooms-->
    <div class="flex justify-content-between">
      <div>
        <h1 class="m-0 text-color text-3xl">
          {{ $t('app.rooms') }}
        </h1>
      </div>
      <div v-if="userPermissions.can('create', 'RoomPolicy')" class="flex align-items-end gap-2 flex-column">
        <RoomCreateComponent
          :disabled="limitReached"
          @limit-reached="onReachLimit"
        />
        <Tag v-if="showLimit" severity="info" class="w-full" >
          {{ $t('rooms.room_limit',{has: paginator.getMetaProperty('total_own'),max: authStore.currentUser.room_limit}) }}
        </Tag>
      </div>
    </div>
    <Divider />

    <!--  search, sorting, favorite-->
    <div class="grid">
      <div class="col-12 md:col-4">
        <!--search-->
        <InputGroup class="mb-2" data-test="room-search">
          <InputText
            ref="search"
            v-model="rawSearchQuery"
            :disabled="loadingRooms"
            :placeholder="$t('app.search')"
            @keyup.enter="loadRooms(1)"
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
            data-test="filter-button"
            class="block md:hidden"
            :severity="toggleMobileMenu?'primary':'secondary'"
            @click="toggleMobileMenu=!toggleMobileMenu"
            icon="fa-solid fa-filter"
            :label="$t('rooms.index.filter')"
          />

          <!--only favorites button-->
          <Button
            data-test="only-favorites-button"
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
      <div class="flex flex-wrap flex-shrink-0 gap-1">
        <ToggleButton
          v-model="roomFilterAll"
          @change="loadRooms(1)"
          v-if="!onlyShowFavorites && userPermissions.can('viewAll', 'RoomPolicy')"
          :on-label="$t('rooms.index.show_all')"
          :off-label="$t('rooms.index.show_all')"
          class="border-1 border-300 border-round"
          :pt="{
            box: {
              class: 'bg-white'
            }
          }"
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
          class="border-1 border-300 border-round"
          :pt="{
            button: {
              class: 'bg-white'
            }
          }"
        />

      </div>
      <div class="flex flex-column md:flex-row align-items-start gap-2">
        <!-- room type select (on small devices only shown, when filter menu is open)-->
        <InputGroup v-if="!onlyShowFavorites" data-test="room-type-inputgroup">
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
            data-test="room-type-dropdown"
            v-else
            v-model="selectedRoomType"
            :disabled="loadingRooms||roomTypesBusy||onlyShowFavorites"
            @change="loadRooms(1)"
            :placeholder="$t('rooms.room_types.all')"
            :options="roomTypes"
            showClear
            optionLabel="name"
            optionValue="id"
            :pt="{
              panel: {
                'data-test': 'room-type-dropdown-items'
              }
            }"
          >
            <template #clearicon="{ clearCallback }">
              <span class="p-dropdown-clear" role="button" @click.stop="clearCallback">
                <i class="fa-solid fa-times"/>
              </span>
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
            data-test="sorting-type-dropdown"
            v-model="selectedSortingType"
            @change="loadRooms(1)"
            :disabled="loadingRooms"
            :options="sortingTypes"
            optionLabel="label"
            optionValue="type"
            :pt="{
              panel: {
                'data-test': 'sorting-type-dropdown-items'
              }
            }"
          />
        </InputGroup>
      </div>
    </div>

    <!--rooms overlay-->
    <OverlayComponent
      class="mt-3"
      v-if="!showNoFilterMessage"
      :show="loadingRoomsError && !loadingRooms"
      :noCenter="true"
      :opacity="0"
      :z-index="3"
    >
      <template #overlay>
        <div class="text-center py-8">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl" v-if="loadingRooms"  />
          <Button
            data-test="reload-button"
            v-else
            @click="reload()"
          >
            <i class="fa-solid fa-sync mr-2" /> {{ $t('app.reload') }}
          </Button>
        </div>
      </template>

      <!--show room skeleton during loading or error-->
      <div class="grid p-1" v-if="loadingRooms || loadingRoomsError">
        <div
          class="col-12 md:col-6 lg:col-4 p-2"
          v-for="i in rooms?.length || 3"
          :key="i"
        >
          <RoomCardSkeleton :animation="loadingRooms ? 'wave' : (loadingRoomsError ? 'none' : null)" />
        </div>
      </div>

        <DataView
          :totalRecords="paginator.getTotalRecords()"
          :rows="paginator.getRows()"
          :first="paginator.getFirst()"
          :value="rooms"
          lazy
          dataKey="id"
          :paginator="!loadingRooms && !loadingRoomsError"
          :paginator-template="paginator.getTemplate()"
          :current-page-report-template="paginator.getCurrentPageReportTemplate()"
          rowHover
          class="mt-4"
          @page="onPage"
          :pt="{
            content: {
              class: 'bg-transparent'
            },
            paginator: {
              root: {
                class: 'bg-transparent'
              },
              pageButton: ({ props, state, context }) => ({
                class: context.active ? 'bg-primary' : undefined
              })
            }
          }"
        >
          <!-- Show message on empty room list -->
          <template #empty>
            <div>
              <div class="text-center" v-if="rooms && !loadingRooms && !loadingRoomsError">
                <InlineMessage severity="info" v-if="onlyShowFavorites && paginator.isEmptyUnfiltered()"> {{ $t('rooms.index.no_favorites') }} </InlineMessage>
                <InlineMessage severity="info" v-else-if="paginator.isEmptyUnfiltered()">{{ $t('rooms.no_rooms_available') }}</InlineMessage>
                <InlineMessage severity="info" v-else-if="!rooms.length">{{ $t('rooms.no_rooms_found') }}</InlineMessage>
              </div>
            </div>
          </template>

          <template #list="slotProps">
            <div v-if="!loadingRooms && !loadingRoomsError" class="grid p-1">
              <div
                class="col-12 md:col-6 lg:col-4 p-2"
                v-for="(room, index) in slotProps.items"
                :key="index"
              >
                <RoomCard
                  :room="room"
                  @favorites-changed="loadRooms()"
                />
              </div>
            </div>
          </template>
        </DataView>
    </OverlayComponent>
    <div
      v-else
      class="text-center mt-3"
    >
      <InlineMessage severity="error">{{ $t('rooms.index.no_rooms_selected') }}</InlineMessage>
      <br>
      <Button
        data-test="filter-reset-button"
        class="mt-2"
        ref="reset"
        @click="resetRoomFilter"
        :label="$t('rooms.index.reset_filter')"
        icon="fa-solid fa-rotate-left"
      />
    </div>
  </div>
</template>

<script setup>

import { useAuthStore } from '../stores/auth';
import { onMounted, ref, computed } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useI18n } from 'vue-i18n';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { usePaginator } from '../composables/usePaginator.js';

const authStore = useAuthStore();
const api = useApi();
const { t } = useI18n();
const userPermissions = useUserPermissions();
const paginator = usePaginator();

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

function onPage (event) {
  loadRooms(event.page + 1);
}

const showLimit = computed(() => {
  return authStore.currentUser && authStore.currentUser.room_limit !== -1 && rooms.value !== null;
});

const limitReached = computed(() => {
  return authStore.currentUser && authStore.currentUser.room_limit !== -1 && rooms.value !== null && paginator.getMetaProperty('total_own') >= authStore.currentUser.room_limit;
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
  if (roomFilter.value.length === 0 && roomFilterAll.value === false) {
    showNoFilterMessage.value = true;
    return;
  }
  showNoFilterMessage.value = false;
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
      page: page || paginator.getCurrentPage()
    }
  }).then(response => {
    // operation successful, set rooms and reset loadingRoomsError
    rooms.value = response.data.data;
    // update paginator metadata, if the current page is out of range, load the last possible page
    paginator.updateMeta(response.data.meta).then(() => {
      if (paginator.isOutOfRange()) {
        loadRooms(paginator.getLastPage());
      }
    });

    loadingRoomsError.value = false;
  }).catch(error => {
    // failed
    loadingRoomsError.value = true;
    api.error(error);
  }).finally(() => {
    loadingRooms.value = false;
  });
}

</script>
