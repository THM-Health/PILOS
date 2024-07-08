<template>
  <div>
    <div class="flex justify-between flex-col-reverse lg:flex-row gap-2 px-2">
      <div class="flex justify-between flex-col lg:flex-row grow gap-2">
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
        <div class="flex gap-2 flex-col lg:flex-row">
          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="filter" :options="filterOptions" @change="loadData(1)" option-label="name" option-value="value" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :disabled="isBusy" :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="rounded-l-none"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <RoomTabMembersAddButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @added="loadData()"
        />

        <!-- Reload -->
        <Button
          class="shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <OverlayComponent :show="isBusy || loadingError" z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>

      <DataView
        :totalRecords="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="members"
        lazy
        dataKey="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        rowHover
        @page="onPage"
        class="mt-6"
      >

        <!-- Show message on empty list -->
        <template #empty>
          <div>
            <div class="px-2" v-if="!isBusy && !loadingError">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{ $t('rooms.members.nodata') }}</InlineNote>
              <InlineNote v-else>{{ $t('app.filter_no_results') }}</InlineNote>
            </div>
          </div>
        </template>

        <template #header v-if="selectableMembers.length > 0">
          <div class="flex justify-between mb-2">
             <Checkbox
                :model-value="selectedMembers.length === selectableMembers.length"
                @update:modelValue="toggleSelectAll"
                :binary="true"
              />
            <!-- selected rows action buttons -->
            <div class="flex gap-1" v-if="selectedMembers.length > 0">
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
          <div class="px-2 border-t border-b border-surface">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-col md:flex-row justify-between gap-4 py-4" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-row gap-6">
                  <div class="flex items-center">
                    <Checkbox
                      :disabled="authStore.currentUser && authStore.currentUser.id === item.id"
                      :model-value="isMemberSelected(item.id)"
                      @update:modelValue="(selected) => onMemberSelected(item.id, selected)"
                      :binary="true"
                    />
                  </div>
                  <div class="flex items-center">
                    <UserAvatar :firstname="item.firstname" :lastname="item.lastname" :image="item.image" size="large"/>
                  </div>
                  <div class="flex flex-col gap-2">
                    <p class="text-lg font-semibold m-0 text-word-break">{{ item.firstname }} {{ item.lastname }}</p>
                    <div class="flex flex-col gap-2 items-start">
                      <div class="flex flex-row gap-2">
                        <i class="fa-solid fa-envelope" />
                        <p class="text-sm m-0 text-word-break">{{ item.email }}</p>
                      </div>
                      <div class="flex flex-row gap-2">
                        <i class="fa-solid fa-user-tag"></i>
                        <RoomRoleBadge :role="item.role" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="shrink-0 flex flex-row gap-1 items-start justify-end" v-if="userPermissions.can('manageSettings', props.room) && authStore.currentUser?.id !== item.id">
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
import { useAuthStore } from '../stores/auth';
import EventBus from '../services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '../constants/events';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { usePaginator } from '../composables/usePaginator.js';
import UserAvatar from './UserAvatar.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const authStore = useAuthStore();
const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);
const members = ref([]);
const sortField = ref('lastname');
const sortOrder = ref(1);
const search = ref('');
const filter = ref('all');
const selectedMembers = ref([]);

const sortFields = computed(() => [
  { name: t('app.firstname'), value: 'firstname' },
  { name: t('app.lastname'), value: 'lastname' }
]);

const filterOptions = computed(() => [
  { name: t('rooms.members.filter.all'), value: 'all' },
  { name: t('rooms.members.filter.participant_role'), value: 'participant_role' },
  { name: t('rooms.members.filter.moderator_role'), value: 'moderator_role' },
  { name: t('rooms.members.filter.co_owner_role'), value: 'co_owner_role' }
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

function toggleSelectAll (checked) {
  if (checked) {
    selectedMembers.value = selectableMembers.value;
  } else {
    selectedMembers.value = [];
  }
}

function isMemberSelected (id) {
  return selectedMembers.value.some(memberId => memberId === id);
}

function onMemberSelected (id, selected) {
  if (selected) {
    selectedMembers.value.push(id);
  } else {
    selectedMembers.value = selectedMembers.value.filter(memberId => memberId !== id);
  }
}

/**
 * reload member list from api
 */
function loadData (page = null) {
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
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      search: search.value === '' ? null : search.value,
      filter: filter.value === 'all' ? null : filter.value
    }
  };

  api.call('rooms/' + props.room.id + '/member', config)
    .then(response => {
      // fetching successful
      members.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
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

// list of member ids that can be selected on the current page (user cannot select himself)
const selectableMembers = computed(() => {
  return members.value.map(member => member.id).filter(id => id !== authStore.currentUser?.id);
});

/**
 * Sets the event listener for current room change to reload the member list.
 *
 * @method mounted
 * @return undefined
 */
onMounted(() => {
  EventBus.on(EVENT_CURRENT_ROOM_CHANGED, onRoomChanged);
  loadData();
});

function onRoomChanged () {
  loadData();
}

/**
 * Removes the listener for current room change
 *
 * @method beforeDestroy
 * @return undefined
 */
onBeforeUnmount(() => {
  EventBus.off(EVENT_CURRENT_ROOM_CHANGED, onRoomChanged);
});
</script>
