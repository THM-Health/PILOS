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
        <RoomTabMembersAddButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @added="loadData()"
        />

        <!-- Reload -->
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

    <OverlayComponent :show="isBusy" style="min-height: 4rem;" z-index="1">
      <DataView
        :totalRecords="meta.total"
        :rows="meta.per_page"
        :value="members"
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
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter === 0">{{ $t('rooms.members.nodata') }}</InlineNote>
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter !== 0">{{ $t('app.filter_no_results') }}</InlineNote>
          </div>
        </template>

        <template #header v-if="selectableMembers.length > 0">
          <div class="flex justify-content-between mb-2">
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
          <div class="px-2 border-top-1 border-bottom-1 surface-border">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-column md:flex-row justify-content-between gap-3 py-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-row gap-4">
                  <div class="flex align-items-center">
                    <Checkbox
                      :disabled="authStore.currentUser && authStore.currentUser.id === item.id"
                      :model-value="isMemberSelected(item.id)"
                      @update:modelValue="(selected) => onMemberSelected(item.id, selected)"
                      :binary="true"
                    />
                  </div>
                  <div class="flex align-items-center">
                    <UserAvatar :firstname="item.firstname" :lastname="item.lastname" :image="item.image" size="large"/>
                  </div>
                  <div class="flex flex-column gap-2">
                    <p class="text-lg font-semibold m-0 text-word-break">{{ item.firstname }} {{ item.lastname }}</p>
                    <div class="flex flex-column gap-2 align-items-start">
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

                <div class="flex-shrink-0 flex flex-row gap-1 align-items-start justify-content-end" v-if="showManagementColumns && authStore.currentUser?.id !== item.id">
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
import _ from 'lodash';
import { useAuthStore } from '../stores/auth';
import EventBus from '../services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '../constants/events';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
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
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);
const members = ref([]);
const sortField = ref('lastname');
const sortOrder = ref(1);
const search = ref('');
const filter = ref('all');
const selectedMembers = ref([]);
const meta = ref({
  current_page: 1,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

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
  loadData();
};

function toggleSelectAll (checked) {
  if (checked) {
    selectedMembers.value = _.clone(selectableMembers.value);
  } else {
    selectedMembers.value = [];
  }
}

function isMemberSelected (id) {
  return selectedMembers.value.some(memberId => memberId === id);
}

function onMemberSelected (id, selected) {
  let selection = _.clone(selectedMembers.value);
  if (selected) {
    selection.push(id);
  } else {
    selection = selection.filter(memberId => memberId !== id);
  }

  selectedMembers.value = selection;
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
      page: page || meta.value.current_page,
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

// list of member ids that can be selected on the current page (user cannot select himself)
const selectableMembers = computed(() => {
  return members.value.map(member => member.id).filter(id => id !== authStore.currentUser?.id);
});

const showManagementColumns = computed(() => {
  return userPermissions.can('manageSettings', props.room);
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
