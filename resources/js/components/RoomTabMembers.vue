<template>
  <div>
    <div class="flex flex-col-reverse justify-between gap-2 px-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <div>
          <InputGroup data-test="room-members-search">
            <InputText
              v-model="search"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              v-tooltip="$t('app.search')"
              :disabled="isBusy"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
              @click="loadData(1)"
            />
          </InputGroup>
        </div>
        <div class="flex flex-col gap-2 lg:flex-row">
          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select
              v-model="filter"
              data-test="filter-dropdown"
              :disabled="isBusy"
              :options="filterOptions"
              option-label="name"
              option-value="value"
              :pt="{
                listContainer: {
                  'data-test': 'filter-dropdown-items',
                },
                option: {
                  'data-test': 'filter-dropdown-option',
                },
              }"
              @change="loadData(1)"
            />
          </InputGroup>

          <InputGroup data-test="sorting-type-inputgroup">
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select
              v-model="sortField"
              data-test="sorting-type-dropdown"
              :disabled="isBusy"
              :options="sortFields"
              option-label="name"
              option-value="value"
              :pt="{
                listContainer: {
                  'data-test': 'sorting-type-dropdown-items',
                },
                option: {
                  'data-test': 'sorting-type-dropdown-option',
                },
              }"
              @change="loadData(1)"
            />
            <InputGroupAddon class="p-0">
              <Button
                :disabled="isBusy"
                :icon="
                  sortOrder === 1
                    ? 'fa-solid fa-arrow-up-short-wide'
                    : 'fa-solid fa-arrow-down-wide-short'
                "
                severity="secondary"
                text
                class="rounded-l-none"
                @click="toggleSortOrder"
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <RoomTabMembersAddButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @added="loadData()"
        />

        <!-- Reload -->
        <Button
          v-tooltip="$t('app.reload')"
          data-test="room-members-reload-button"
          class="shrink-0"
          :aria-label="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          icon="fa-solid fa-sync"
          @click="loadData()"
        />
      </div>
    </div>

    <OverlayComponent :show="isBusy || loadingError" :z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>

      <DataView
        :total-records="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="members"
        lazy
        data-key="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
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
        <!-- Show message on empty list -->
        <template #empty>
          <div>
            <div v-if="!isBusy && !loadingError" class="px-2">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("rooms.members.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template
          v-if="
            selectableMembers.length > 0 &&
            userPermissions.can('manageSettings', props.room)
          "
          #header
        >
          <div class="mb-2 flex justify-between">
            <Checkbox
              :model-value="selectedMembers.length === selectableMembers.length"
              :binary="true"
              data-test="room-members-select-all-checkbox"
              @update:model-value="toggleSelectAll"
            />
            <!-- selected rows action buttons -->
            <div v-if="selectedMembers.length > 0" class="flex gap-1">
              <!-- bulk edit membership role -->
              <RoomTabMembersBulkEditButton
                :room-id="props.room.id"
                :user-ids="selectedMembers"
                :disabled="isBusy"
                @edited="loadData()"
              />
              <!-- bulk remove member -->
              <RoomTabMembersBulkDeleteButton
                :room-id="props.room.id"
                :user-ids="selectedMembers"
                :disabled="isBusy"
                @deleted="loadData()"
              />
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="(item, index) in slotProps.items" :key="item.id">
              <div
                data-test="room-member-item"
                class="flex flex-col justify-between gap-4 py-4 md:flex-row"
                :class="{ 'border-t border-surface': index !== 0 }"
              >
                <div class="flex flex-row gap-6">
                  <div
                    v-if="userPermissions.can('manageSettings', props.room)"
                    class="flex items-center"
                  >
                    <Checkbox
                      :disabled="
                        authStore.currentUser &&
                        authStore.currentUser.id === item.id
                      "
                      :model-value="isMemberSelected(item.id)"
                      :binary="true"
                      @update:model-value="
                        (selected) => onMemberSelected(item.id, selected)
                      "
                    />
                  </div>
                  <div class="flex items-center">
                    <UserAvatar
                      :firstname="item.firstname"
                      :lastname="item.lastname"
                      :image="item.image"
                      size="large"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <p class="text-word-break m-0 text-lg font-semibold">
                      {{ item.firstname }} {{ item.lastname }}
                    </p>
                    <div class="flex flex-col items-start gap-2">
                      <div class="flex flex-row gap-2">
                        <i class="fa-solid fa-envelope" />
                        <p class="text-word-break m-0 text-sm">
                          {{ item.email }}
                        </p>
                      </div>
                      <div class="flex flex-row gap-2">
                        <i class="fa-solid fa-user-tag"></i>
                        <RoomRoleBadge :role="item.role" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="
                    userPermissions.can('manageSettings', props.room) &&
                    authStore.currentUser?.id !== item.id
                  "
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <!-- edit membership role -->
                  <RoomTabMembersEditButton
                    :room-id="props.room.id"
                    :firstname="item.firstname"
                    :lastname="item.lastname"
                    :role="item.role"
                    :user-id="item.id"
                    :disabled="isBusy"
                    @edited="loadData()"
                  />
                  <!-- remove member -->
                  <RoomTabMembersDeleteButton
                    :room-id="props.room.id"
                    :firstname="item.firstname"
                    :lastname="item.lastname"
                    :user-id="item.id"
                    :disabled="isBusy"
                    @deleted="loadData()"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </OverlayComponent>
  </div>
</template>
<script setup>
import { useAuthStore } from "../stores/auth";
import { computed, onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { usePaginator } from "../composables/usePaginator.js";
import UserAvatar from "./UserAvatar.vue";
import { useI18n } from "vue-i18n";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

const authStore = useAuthStore();
const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);
const members = ref([]);
const sortField = ref("lastname");
const sortOrder = ref(1);
const search = ref("");
const filter = ref("all");
const selectedMembers = ref([]);

const sortFields = computed(() => [
  { name: t("app.firstname"), value: "firstname" },
  { name: t("app.lastname"), value: "lastname" },
]);

const filterOptions = computed(() => [
  { name: t("rooms.members.filter.all"), value: "all" },
  {
    name: t("rooms.members.filter.participant_role"),
    value: "participant_role",
  },
  { name: t("rooms.members.filter.moderator_role"), value: "moderator_role" },
  { name: t("rooms.members.filter.co_owner_role"), value: "co_owner_role" },
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

function toggleSelectAll(checked) {
  if (checked) {
    selectedMembers.value = selectableMembers.value;
  } else {
    selectedMembers.value = [];
  }
}

function isMemberSelected(id) {
  return selectedMembers.value.some((memberId) => memberId === id);
}

function onMemberSelected(id, selected) {
  if (selected) {
    selectedMembers.value.push(id);
  } else {
    selectedMembers.value = selectedMembers.value.filter(
      (memberId) => memberId !== id,
    );
  }
}

/**
 * reload member list from api
 */
function loadData(page = null) {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;

  // clear selection
  selectedMembers.value = [];
  // make request to load users

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      search: search.value === "" ? null : search.value,
      filter: filter.value === "all" ? null : filter.value,
    },
  };

  api
    .call("rooms/" + props.room.id + "/member", config)
    .then((response) => {
      // fetching successful
      members.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      paginator.revertFirst();
      api.error(error, { redirectOnUnauthenticated: false });
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

// list of member ids that can be selected on the current page (user cannot select himself)
const selectableMembers = computed(() => {
  return members.value
    .map((member) => member.id)
    .filter((id) => id !== authStore.currentUser?.id);
});

onMounted(() => {
  loadData();
});

onRoomHasChanged(
  () => props.room,
  () => loadData(),
);
</script>
