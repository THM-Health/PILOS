<template>
  <div>
      <div class="flex flex-wrap gap-2 justify-content-end flex-column-reverse md:flex-row">
        <div class="flex flex-wrap justify-content-between gap-2">
          <!-- Add existing user from database -->
          <RoomTabMembersAddButton
            v-if="userPermissions.can('manageSettings', props.room)"
            :room-id="props.room.id"
            :disabled="isBusy"
            @added="loadData"
          />

          <!-- Bulk Import -->
          <RoomTabMembersBulkImportButton
            v-if="userPermissions.can('manageSettings', props.room)"
            :room-id="props.room.id"
            :disabled="isBusy"
            @imported="loadData"
          />
        </div>
        <!-- Reload members list -->
        <div class="flex justify-content-end">
          <Button
            v-tooltip="$t('app.reload')"
            severity="secondary"
            :disabled="isBusy"
            @click="loadData"
            icon="fa-solid fa-sync"
          />
        </div>
      </div>
      <!-- table with room members -->
      <DataTable
        class="mt-4"
        :totalRecords="meta.total"
        :rows="meta.per_page"
        :value="members"
        lazy
        v-model:selection="selectedMembers"
        dataKey="id"
        paginator
        :loading="isBusy"
        rowHover
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
        @page="onPage"
        @sort="onSort"
        :select-all="selectableMembers === selectedMembers.length && selectableMembers > 0"
        @select-all-change="toggleSelectAll"
      >
        <!-- Show message on empty attendance list -->
        <template #empty>
          <i>{{ $t('meetings.attendance.nodata') }}</i>
        </template>

        <Column selectionMode="multiple" headerStyle="width: 3rem" v-if="userPermissions.can('manageSettings', props.room)">
          <template #body="slotProps">
            <Checkbox
              v-if="authStore.currentUser && authStore.currentUser.id !== slotProps.data.id"
              :model-value="isRowSelected(slotProps.data)"
              @input="(selected) => onRowSelected(slotProps.data, selected)"
              :binary="true"
            />
          </template>
        </Column>
        <Column field="image" :header="$t('rooms.members.image')">
          <!-- render user profile image -->
          <template #body="slotProps">
            <UserAvatar :firstname="slotProps.data.firstname" :lastname="slotProps.data.lastname" :image="slotProps.data.image" size="large"/>
          </template>
        </Column>
        <Column field="firstname" sortable :header="$t('app.firstname')"></Column>
        <Column field="lastname" sortable :header="$t('app.lastname')"></Column>
        <Column field="email" sortable :header="$t('app.email')"></Column>
        <Column field="role" sortable :header="$t('rooms.role')">
          <!-- render user role -->
          <template #body="slotProps">
            <RoomRoleBadge
              :role="slotProps.data.role"
            />
          </template>
        </Column>
        <Column :header="$t('app.actions')" class="action-column" v-if="userPermissions.can('manageSettings', props.room)">
          <template #body="slotProps">
            <div
              v-if="authStore.currentUser?.id !== slotProps.data.id"
              class="flex gap-2"
            >
              <!-- edit membership role -->
              <RoomTabMembersEditButton
                :room-id="props.room.id"
                :firstname="slotProps.data.firstname"
                :lastname="slotProps.data.lastname"
                :role="slotProps.data.role"
                :user-id="slotProps.data.id"
                :disabled="isBusy"
                @edited="loadData"
              />
              <!-- remove member -->
              <RoomTabMembersDeleteButton
                :room-id="props.room.id"
                :firstname="slotProps.data.firstname"
                :lastname="slotProps.data.lastname"
                :user-id="slotProps.data.id"
                :disabled="isBusy"
                @deleted="loadData"
              />
            </div>
          </template>
        </Column>
      </DataTable>
      <!-- selected rows action buttons -->
      <div class="flex gap-2" v-if="selectedMembers.length > 0">
        <!-- bulk edit membership role -->
        <RoomTabMembersBulkEditButton
          :room-id="props.room.id"
          :user-ids="selectedMembers.map(user => user.id)"
          :disabled="isBusy"
          @edited="loadData"
        />
        <!-- bulk remove member -->
        <RoomTabMembersBulkDeleteButton
          :room-id="props.room.id"
          :user-ids="selectedMembers.map(user => user.id)"
          :disabled="isBusy"
          @deleted="loadData"
        />
      </div>
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

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const authStore = useAuthStore();
const api = useApi();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const members = ref([]);
const currentPage = ref(1);
const sortField = ref('lastname');
const sortOrder = ref(1);
const selectedMembers = ref([]);
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

function toggleSelectAll (event) {
  if (event.checked) {
    selectedMembers.value = members.value.filter(user => user.id !== authStore.currentUser?.id);
  } else {
    selectedMembers.value = [];
  }
}

function isRowSelected (data) {
  return selectedMembers.value.some(member => member.id === data.id);
}

function onRowSelected (data, selected) {
  let selection = _.clone(selectedMembers.value);
  if (selected) {
    selection.push(data);
  } else {
    selection = selection.filter(member => member.id !== data.id);
  }

  selectedMembers.value = selection;
}

/**
 * reload member list from api
 */
function loadData () {
  // enable data loading indicator
  isBusy.value = true;
  // make request to load users

  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
    }
  };

  api.call('rooms/' + props.room.id + '/member', config)
    .then(response => {
      // fetching successful
      members.value = response.data.data;
      meta.value = response.data.meta;
    })
    .catch((error) => {
      api.error(error, this.$root);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  selectedMembers.value = [];
  loadData();
}

function onSort () {
  selectedMembers.value = [];
  loadData();
}

// amount of members that can be selected on the current page (user cannot select himself)
const selectableMembers = computed(() => {
  return members.value.filter(member => member.id !== authStore.currentUser?.id).length;
});

/**
 * Sets the event listener for current room change to reload the member list.
 *
 * @method mounted
 * @return undefined
 */
onMounted(() => {
  EventBus.on(EVENT_CURRENT_ROOM_CHANGED, loadData);
  loadData();
});

/**
 * Removes the listener for current room change
 *
 * @method beforeDestroy
 * @return undefined
 */
onBeforeUnmount(() => {
  EventBus.off(EVENT_CURRENT_ROOM_CHANGED, loadData);
});
</script>