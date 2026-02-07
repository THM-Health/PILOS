<template>
  <div>
    <div class="flex flex-col-reverse justify-between gap-2 px-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <div>
          <InputGroup data-test="room-role-members-search">
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
        <RoomTabRoleMembersAddModal
          v-if="userPermissions.can('manageSettings', props.room)"
          ref="addModal"
          :room-id="props.room.id"
          @added="loadData()"
        />

        <!-- Reload -->
        <Button
          v-tooltip="$t('app.reload')"
          data-test="room-role-members-reload-button"
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
        :value="roleMembers"
        lazy
        data-key="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        row-hover
        class="mt-6"
        @update:first="paginator.setFirst($event)"
        @page="onPage"
      >
        <!-- Show message on empty list -->
        <template #empty>
          <div>
            <div v-if="!isBusy && !loadingError" class="px-2">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("rooms.members.role_members.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="(item, index) in slotProps.items" :key="item.id">
              <div
                data-test="room-role-member-item"
                class="flex flex-col justify-between gap-4 py-4 md:flex-row"
                :class="{ 'border-t border-surface': index !== 0 }"
              >
                <div class="flex flex-row gap-6">
                  <div class="flex items-center">
                    <i class="fa-solid fa-users text-2xl"></i>
                  </div>
                  <div class="flex flex-col gap-2">
                    <p class="text-word-break m-0 text-lg font-semibold">
                      {{ item.name }}
                    </p>
                    <div class="flex flex-col items-start gap-2">
                      <div class="flex flex-row items-center gap-2">
                        <i class="fa-solid fa-users"></i>
                        <p class="m-0 text-sm">
                          {{ $t("rooms.members.role_members.user_count", { count: item.user_count }) }}
                        </p>
                      </div>
                      <div class="flex flex-row items-center gap-2">
                        <i class="fa-solid fa-user-tag"></i>
                        <RoomRoleBadge :role="item.role" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="userPermissions.can('manageSettings', props.room)"
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <!-- edit role permission level -->
                  <RoomTabRoleMembersEditButton
                    :room-id="props.room.id"
                    :role-name="item.name"
                    :role="item.role"
                    :role-id="item.id"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @gone="loadData()"
                  />
                  <!-- remove role -->
                  <RoomTabRoleMembersDeleteButton
                    :room-id="props.room.id"
                    :role-name="item.name"
                    :role-id="item.id"
                    :disabled="isBusy"
                    @deleted="loadData()"
                    @gone="loadData()"
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
import { computed, onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { usePaginator } from "../composables/usePaginator.js";
import { useI18n } from "vue-i18n";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);
const roleMembers = ref([]);
const sortField = ref("name");
const sortOrder = ref(1);
const search = ref("");
const filter = ref("all");

const sortFields = computed(() => [
  { name: t("app.model_name"), value: "name" },
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

/**
 * reload role member list from api
 */
function loadData(page = null) {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      query: search.value === "" ? null : search.value,
      filter: filter.value === "all" ? null : filter.value,
    },
  };

  api
    .call("rooms/" + props.room.id + "/role-member", config)
    .then((response) => {
      roleMembers.value = response.data.data;
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

onMounted(() => {
  loadData();
});

onRoomHasChanged(
  () => props.room,
  () => loadData(),
);
</script>
