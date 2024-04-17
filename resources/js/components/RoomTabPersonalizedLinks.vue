<template>
  <div>
    <div class="flex justify-content-between flex-column-reverse lg:flex-row gap-2 px-2">
      <div class="flex justify-content-between flex-column lg:flex-row flex-grow-1 gap-2">
        <div>
          <InputGroup>
            <InputText
              v-model="search"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              :disabled="isBusy"
              @click="loadData(1)"
              v-tooltip="$t('app.search')"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
            />
          </InputGroup>
        </div>
        <div class="flex gap-2 flex-column lg:flex-row">
          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Dropdown v-model="filter" :options="filterOptions" @change="loadData(1)" option-label="name" option-value="value" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Dropdown v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="border-noround-left"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex gap-2 justify-content-end">
        <!-- add -->
        <RoomTabPersonalizedLinksAddButton
          :room-id="props.room.id"
          :disabled="isBusy"
          @added="loadData()"
        />

        <!-- Reload file list -->
        <Button
          class="flex-shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <OverlayComponent :show="isBusy" z-index="1">
      <DataView
        :totalRecords="meta.total"
        :rows="meta.per_page"
        :first="meta.from"
        :value="tokens"
        lazy
        dataKey="id"
        paginator
        rowHover
        @page="onPage"
        class="mt-4"
      >

        <!-- Show message on empty list -->
        <template #empty>
          <div class="px-2">
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter === 0">{{ $t('rooms.tokens.nodata') }}</InlineNote>
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter !== 0">{{ $t('app.filter_no_results') }}</InlineNote>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2 border-top-1 border-bottom-1 surface-border">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-column md:flex-row justify-content-between gap-3 py-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-column gap-2">
                  <p class="text-lg font-semibold m-0">{{ item.firstname }} {{ item.lastname }}</p>
                  <div class="flex flex-column gap-2 align-items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="text-sm m-0">
                        <span v-if="item.last_usage == null">{{ $t('rooms.tokens.last_used_never') }}</span>
                        <span v-else>{{ $t('rooms.tokens.last_used_at', {date:  $d(new Date(item.last_usage),'datetimeShort') })}}</span>
                      </p>
                    </div>
                    <div class="flex flex-row gap-2" v-if="item.expires !== null">
                      <i class="fa-regular fa-calendar-xmark"></i>
                      <p class="text-sm m-0">{{ $t('rooms.tokens.expires_at', {date:  $d(new Date(item.expires),'datetimeShort')}) }}</p>
                    </div>
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-user-tag"></i>
                      <RoomRoleBadge :role="item.role" />
                    </div>
                  </div>
                </div>

                <div class="flex-shrink-0 flex flex-row gap-1 align-items-start justify-content-end" >
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
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  room: Object
});

const api = useApi();
const userPermissions = useUserPermissions();
const { t } = useI18n();

const tokens = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref('lastname');
const sortOrder = ref(1);
const search = ref('');
const filter = ref('all');

const sortFields = computed(() => [
  { name: t('app.firstname'), value: 'firstname' },
  { name: t('app.lastname'), value: 'lastname' },
  { name: t('rooms.tokens.last_usage'), value: 'last_usage' }
]);

const filterOptions = computed(() => [
  { name: t('rooms.tokens.filter.all'), value: 'all' },
  { name: t('rooms.tokens.filter.participant_role'), value: 'participant_role' },
  { name: t('rooms.tokens.filter.moderator_role'), value: 'moderator_role' }
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

const meta = ref({
  current_page: 1,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0,
  total_no_filter: 0
});

/**
 * (Re)loads list of tokens from api
 */
function loadData (page = null) {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: page || meta.value.current_page,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      search: search.value === '' ? null : search.value,
      filter: filter.value === 'all' ? null : filter.value
    }
  };

  api.call('rooms/' + props.room.id + '/tokens', config)
    .then(response => {
      tokens.value = response.data.data;
      meta.value = response.data.meta;
    })
    .catch((error) => {
      api.error(error);
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage (event) {
  loadData(event.page + 1);
}

onMounted(() => {
  loadData();
});

</script>
