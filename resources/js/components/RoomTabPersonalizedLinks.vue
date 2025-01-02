<template>
  <div>
    <div class="flex flex-col-reverse justify-between gap-2 px-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <div>
          <InputGroup data-test="room-personalized-links-search">
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
        <!-- add -->
        <RoomTabPersonalizedLinksAddButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @added="loadData()"
        />

        <!-- Reload list -->
        <Button
          v-tooltip="$t('app.reload')"
          data-test="room-personalized-links-reload-button"
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
        :value="tokens"
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
                $t("rooms.tokens.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="item in slotProps.items" :key="item.token">
              <div
                data-test="room-personalized-link-item"
                class="flex flex-col justify-between gap-4 border-t py-4 md:flex-row"
              >
                <div class="flex flex-col gap-2">
                  <p class="m-0 text-lg font-semibold">
                    {{ item.firstname }} {{ item.lastname }}
                  </p>
                  <div class="flex flex-col items-start gap-2">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="m-0 text-sm">
                        <span v-if="item.last_usage == null">{{
                          $t("rooms.tokens.last_used_never")
                        }}</span>
                        <span v-else>{{
                          $t("rooms.tokens.last_used_at", {
                            date: $d(
                              new Date(item.last_usage),
                              "datetimeShort",
                            ),
                          })
                        }}</span>
                      </p>
                    </div>
                    <div
                      v-if="item.expires !== null"
                      class="flex flex-row gap-2"
                    >
                      <i class="fa-regular fa-calendar-xmark"></i>
                      <p class="m-0 text-sm">
                        {{
                          $t("rooms.tokens.expires_at", {
                            date: $d(new Date(item.expires), "datetimeShort"),
                          })
                        }}
                      </p>
                    </div>
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-user-tag"></i>
                      <RoomRoleBadge :role="item.role" />
                    </div>
                  </div>
                </div>

                <div
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <!-- copy -->
                  <RoomTabPersonalizedLinksCopyButton
                    :room-id="props.room.id"
                    :token="item.token"
                    :firstname="item.firstname"
                    :lastname="item.lastname"
                    :disabled="isBusy"
                  />
                  <!-- edit -->
                  <RoomTabPersonalizedLinksEditButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :firstname="item.firstname"
                    :lastname="item.lastname"
                    :role="item.role"
                    :token="item.token"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @not-found="loadData()"
                  />
                  <!-- delete -->
                  <RoomTabPersonalizedLinksDeleteButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :firstname="item.firstname"
                    :lastname="item.lastname"
                    :token="item.token"
                    :disabled="isBusy"
                    @deleted="loadData()"
                    @not-found="loadData()"
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
import { useI18n } from "vue-i18n";
import { usePaginator } from "../composables/usePaginator.js";

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

const tokens = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref("lastname");
const sortOrder = ref(1);
const search = ref("");
const filter = ref("all");

const sortFields = computed(() => [
  { name: t("app.firstname"), value: "firstname" },
  { name: t("app.lastname"), value: "lastname" },
  { name: t("rooms.tokens.last_usage"), value: "last_usage" },
]);

const filterOptions = computed(() => [
  { name: t("rooms.tokens.filter.all"), value: "all" },
  {
    name: t("rooms.tokens.filter.participant_role"),
    value: "participant_role",
  },
  { name: t("rooms.tokens.filter.moderator_role"), value: "moderator_role" },
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

/**
 * (Re)loads list of tokens from api
 */
function loadData(page = null) {
  isBusy.value = true;
  loadingError.value = false;

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
    .call("rooms/" + props.room.id + "/tokens", config)
    .then((response) => {
      tokens.value = response.data.data;
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
</script>
