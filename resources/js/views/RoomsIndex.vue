<template>
  <div class="container mb-8 mt-8">
    <Card>
      <!--  heading and option to add new rooms-->
      <template #title>
        <div class="flex justify-between">
          <div>
            <h1 class="text-3xl">
              {{ $t("app.rooms") }}
            </h1>
          </div>
          <div
            v-if="userPermissions.can('create', 'RoomPolicy')"
            class="flex flex-col items-end gap-2"
          >
            <RoomCreateComponent
              :disabled="limitReached"
              @limit-reached="onReachLimit"
            />
            <Tag v-if="showLimit" severity="info" class="w-full">
              {{
                $t("rooms.room_limit", {
                  has: paginator.getMetaProperty("total_own"),
                  max: authStore.currentUser.room_limit,
                })
              }}
            </Tag>
          </div>
        </div>
      </template>
      <template #content>
        <!--  search, sorting, favorite-->
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-6 lg:col-span-4 2xl:col-span-3">
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
                v-tooltip="$t('app.search')"
                icon="fa-solid fa-magnifying-glass"
                :disabled="loadingRooms"
                :aria-label="$t('app.search')"
                @click="loadRooms(1)"
              />
            </InputGroup>
          </div>
          <div
            class="col-span-12 flex flex-col-reverse items-start justify-end gap-2 md:col-span-6 md:flex-row lg:col-span-8 2xl:col-span-9"
          >
            <div class="flex justify-start gap-2">
              <!--button to open filter menu on small devices-->
              <Button
                data-test="filter-button"
                class="block md:hidden"
                :severity="toggleMobileMenu ? 'primary' : 'secondary'"
                icon="fa-solid fa-filter"
                :label="$t('rooms.index.filter')"
                @click="toggleMobileMenu = !toggleMobileMenu"
              />

              <!--only favorites button-->
              <Button
                data-test="only-favorites-button"
                :severity="onlyShowFavorites ? 'contrast' : 'secondary'"
                :disabled="loadingRooms"
                icon="fa-solid fa-star"
                :label="$t('rooms.index.only_favorites')"
                @click="
                  onlyShowFavorites = !onlyShowFavorites;
                  loadRooms(1);
                "
              />
            </div>
          </div>
        </div>

        <!--filter checkboxes (on small devices only shown, when filter menu is open)-->
        <div
          class="flex-col justify-between gap-2 xl:flex-row"
          :class="toggleMobileMenu ? 'flex' : 'hidden md:flex'"
        >
          <div class="flex shrink-0 flex-wrap gap-1">
            <ToggleButton
              v-if="
                !onlyShowFavorites &&
                userPermissions.can('viewAll', 'RoomPolicy')
              "
              v-model="roomFilterAll"
              data-test="rooms-filter-all-button"
              :on-label="$t('rooms.index.show_all')"
              :off-label="$t('rooms.index.show_all')"
              :disabled="loadingRooms"
              @change="loadRooms(1)"
            >
            </ToggleButton>
            <SelectButton
              v-if="!roomFilterAll && !onlyShowFavorites"
              v-model="roomFilter"
              :options="filterOptions"
              :disabled="onlyShowFavorites || loadingRooms"
              option-label="name"
              option-value="value"
              multiple
              :allow-empty="roomFilter.length > 1"
              :pt="{
                pcToggleButton: {
                  root: {
                    'data-test': 'rooms-filter-button',
                  },
                },
              }"
              @change="loadRooms(1)"
            />
          </div>
          <div class="flex flex-col items-start gap-2 md:flex-row">
            <!-- room type select (on small devices only shown, when filter menu is open)-->
            <InputGroup
              v-if="!onlyShowFavorites"
              data-test="room-type-inputgroup"
            >
              <InputGroupAddon>
                <i class="fa-solid fa-tag"></i>
              </InputGroupAddon>
              <InputGroupAddon
                v-if="roomTypesLoadingError"
                class="grow p-0"
                style="width: 1%"
              >
                <Message severity="error" class="w-full">
                  {{ $t("rooms.room_types.loading_error") }}
                </Message>
              </InputGroupAddon>
              <Select
                v-else
                v-model="selectedRoomType"
                data-test="room-type-dropdown"
                :disabled="loadingRooms || roomTypesBusy || onlyShowFavorites"
                :placeholder="$t('rooms.room_types.all')"
                :options="roomTypes"
                show-clear
                option-label="name"
                option-value="id"
                :pt="{
                  listContainer: {
                    'data-test': 'room-type-dropdown-items',
                  },
                  option: {
                    'data-test': 'room-type-dropdown-option',
                  },
                }"
                @change="loadRooms(1)"
              />
              <!-- reload the room types -->
              <Button
                v-if="roomTypesLoadingError"
                v-tooltip="$t('rooms.room_types.reload')"
                :disabled="roomTypesBusy || onlyShowFavorites"
                severity="secondary"
                outlined
                icon="fa-solid fa-sync"
                :loading="roomTypesBusy"
                @click="loadRoomTypes"
              />
            </InputGroup>

            <!--dropdown for sorting type (on small devices only shown, when filter menu is open)-->
            <InputGroup>
              <InputGroupAddon>
                <i class="fa-solid fa-sort"></i>
              </InputGroupAddon>
              <Select
                v-model="selectedSortingType"
                data-test="sorting-type-dropdown"
                :disabled="loadingRooms"
                :options="sortingTypes"
                option-label="label"
                option-value="type"
                :pt="{
                  listContainer: {
                    'data-test': 'sorting-type-dropdown-items',
                  },
                  option: {
                    'data-test': 'sorting-type-dropdown-option',
                  },
                }"
                @change="loadRooms(1)"
              />
            </InputGroup>
          </div>
        </div>

        <!--rooms overlay-->
        <OverlayComponent
          class="mt-4"
          :show="loadingRoomsError && !loadingRooms"
          :no-center="true"
          :opacity="0"
          :z-index="3"
        >
          <template #overlay>
            <div class="py-20 text-center">
              <i
                v-if="loadingRooms"
                class="fa-solid fa-circle-notch fa-spin text-3xl"
              />
              <Button
                v-else
                data-test="reload-button"
                :label="$t('app.reload')"
                icon="fa-solid fa-sync"
                @click="reload()"
              />
            </div>
          </template>

          <!--show room skeleton during loading or error-->
          <div
            v-if="loadingRooms || loadingRoomsError"
            class="grid grid-cols-12 gap-4 p-1"
          >
            <div
              v-for="i in rooms?.length || 3"
              :key="i"
              class="col-span-12 p-2 md:col-span-6 lg:col-span-4 2xl:col-span-3"
            >
              <RoomCardSkeleton
                :animation="
                  loadingRooms ? 'wave' : loadingRoomsError ? 'none' : null
                "
              />
            </div>
          </div>

          <DataView
            :total-records="paginator.getTotalRecords()"
            :rows="paginator.getRows()"
            :first="paginator.getFirst()"
            :value="rooms"
            lazy
            data-key="id"
            :paginator="!loadingRooms && !loadingRoomsError"
            :paginator-template="paginator.getTemplate()"
            :current-page-report-template="
              paginator.getCurrentPageReportTemplate()
            "
            row-hover
            class="mt-6"
            :pt="{
              pcPaginator: {
                page: {
                  'data-test': 'paginator-page',
                },
                next: {
                  'data-test': 'paginator-next-button',
                },
              },
            }"
            @update:first="paginator.setFirst($event)"
            @page="onPage"
          >
            <!-- Show message on empty room list -->
            <template #empty>
              <div>
                <div
                  v-if="rooms && !loadingRooms && !loadingRoomsError"
                  class="mb-2 text-center"
                >
                  <Message
                    v-if="onlyShowFavorites && paginator.isEmptyUnfiltered()"
                    severity="info"
                  >
                    {{ $t("rooms.index.no_favorites") }}
                  </Message>
                  <Message
                    v-else-if="paginator.isEmptyUnfiltered()"
                    severity="info"
                    >{{ $t("rooms.no_rooms_available") }}</Message
                  >
                  <Message v-else-if="!rooms.length" severity="info">{{
                    $t("rooms.no_rooms_found")
                  }}</Message>
                </div>
              </div>
            </template>

            <template #list="slotProps">
              <div
                v-if="!loadingRooms && !loadingRoomsError"
                class="grid grid-cols-12 gap-4 py-1"
              >
                <div
                  v-for="(room, index) in slotProps.items"
                  :key="index"
                  class="col-span-12 md:col-span-6 lg:col-span-4 2xl:col-span-3"
                >
                  <RoomCard :room="room" @favorites-changed="loadRooms()" />
                </div>
              </div>
            </template>
          </DataView>
        </OverlayComponent>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
import { onMounted, ref, computed } from "vue";
import { useApi } from "../composables/useApi.js";
import { useI18n } from "vue-i18n";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { usePaginator } from "../composables/usePaginator.js";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const authStore = useAuthStore();
const api = useApi();
const { t } = useI18n();
const userPermissions = useUserPermissions();
const paginator = usePaginator();

const toggleMobileMenu = ref(false);
const loadingRooms = ref(false);
const loadingRoomsError = ref(false);
const rooms = ref(null);
const rawSearchQuery = ref("");

const roomFilter = ref(["own", "shared"]);
const roomFilterAll = ref(false);

const onlyShowFavorites = ref(false);
const selectedRoomType = ref(null);
const selectedSortingType = ref("last_started");
const roomTypes = ref([]);
const roomTypesBusy = ref(false);
const roomTypesLoadingError = ref(false);
const perPage = ref(6);

function onPage(event) {
  loadRooms(event.page + 1);
}

const showLimit = computed(() => {
  return (
    authStore.currentUser &&
    authStore.currentUser.room_limit !== -1 &&
    rooms.value !== null
  );
});

const limitReached = computed(() => {
  return (
    authStore.currentUser &&
    authStore.currentUser.room_limit !== -1 &&
    rooms.value !== null &&
    paginator.getMetaProperty("total_own") >= authStore.currentUser.room_limit
  );
});

// t('rooms.index.sorting.select_sorting')

const sortingTypes = computed(() => {
  return [
    {
      type: "last_started",
      label: t("rooms.index.sorting.last_started"),
    },
    {
      type: "alpha",
      label: t("rooms.index.sorting.alpha"),
    },
    {
      type: "room_type",
      label: t("rooms.index.sorting.room_type"),
    },
  ];
});

const breakpoints = useBreakpoints(breakpointsTailwind);

onMounted(() => {
  switch (breakpoints.active().value) {
    case "md":
      perPage.value = 8;
      break;
    case "lg":
    case "xl":
      perPage.value = 9;
      break;
    case "2xl":
      perPage.value = 12;
      break;
    default:
      perPage.value = 6;
  }

  reload();
});

/**
 * Handle event from new room component that the limit was reached
 */
function onReachLimit() {
  authStore.getCurrentUser();
  loadRooms();
}

const filterOptions = computed(() => {
  return [
    {
      name: t("rooms.index.show_own"),
      value: "own",
    },
    {
      name: t("rooms.index.show_shared"),
      value: "shared",
    },
    {
      name: t("rooms.index.show_public"),
      value: "public",
    },
  ];
});

/**
 *  Reload rooms
 */
function reload() {
  loadRoomTypes();
  loadRooms();
}

/**
 * Load the room types
 */
function loadRoomTypes() {
  roomTypesBusy.value = true;

  api
    .call("roomTypes")
    .then((response) => {
      roomTypes.value = response.data.data;
      roomTypesLoadingError.value = false;
    })
    .catch((error) => {
      roomTypesLoadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      roomTypesBusy.value = false;
    });
}

/**
 * Load the rooms of the current user based on the given inputs
 */
function loadRooms(page = null) {
  loadingRooms.value = true;

  api
    .call("rooms", {
      method: "get",
      params: {
        filter_own: roomFilter.value.includes("own") ? 1 : 0,
        filter_shared: roomFilter.value.includes("shared") ? 1 : 0,
        filter_public: roomFilter.value.includes("public") ? 1 : 0,
        filter_all: roomFilterAll.value ? 1 : 0,
        only_favorites: onlyShowFavorites.value ? 1 : 0,
        room_type: selectedRoomType.value,
        sort_by: selectedSortingType.value,
        search:
          rawSearchQuery.value.trim() !== ""
            ? rawSearchQuery.value.trim()
            : null,
        page: page || paginator.getCurrentPage(),
        per_page: perPage.value,
      },
    })
    .then((response) => {
      // operation successful, set rooms and reset loadingRoomsError
      rooms.value = response.data.data;
      // update paginator metadata, if the current page is out of range, load the last possible page
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadRooms(paginator.getLastPage());
        }
      });

      loadingRoomsError.value = false;
    })
    .catch((error) => {
      // failed
      paginator.revertFirst();
      loadingRoomsError.value = true;
      api.error(error);
    })
    .finally(() => {
      loadingRooms.value = false;
    });
}
</script>
