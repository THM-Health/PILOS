<template>
  <div>
    <div class="grid">
      <div class="col">
        <h2>
          {{ $t('app.servers') }}
        </h2>
      </div>
      <div class="col flex justify-content-end align-items-center">
        <router-link
          v-if="userPermissions.can('create', 'ServerPolicy')"
          v-tooltip="$t('settings.servers.new')"
          :aria-label="$t('settings.servers.new')"
          :to="{ name: 'settings.servers.view', params: { id: 'new' } }"
          class="p-button p-button-success"
        >
          <i class="fa-solid fa-plus"/>
        </router-link>
      </div>
      <div class="col-12 md:col-3 flex align-items-center">
        <InputGroup>
          <!--ToDo debounce???-->
          <InputText
            v-model="filter"
            :placeholder="$t('app.search')"
            @change="loadData"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            severity="primary"
            @click="loadData"
          >
          </Button>
        </InputGroup>
      </div>
    </div>
    <Divider/>
    <DataTable
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      :loading="isBusy || loadingError"
      :rows="meta.per_page"
      :totalRecords="meta.total"
      :value="servers"
      dataKey="id"
      lazy
      paginator
      rowHover
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData"/>
      </template>
      <!-- Show message on empty server list -->
      <template #empty>
        <i v-if="!isBusy && !loadingError">{{ $t('settings.servers.no_data') }}</i>
      </template>
      <!--ToDo check if needed-->
      <!--<template #emptyfiltered>-->
      <!--<i>{{ $t('settings.servers.no_data_filtered') }}</i>-->
      <!--</template>-->

      <Column :header="$t('app.id')" field="id" sortable style="width: 8%"></Column>
      <Column :header="$t('app.model_name')" field="name" sortable>
        <template #body="slotProps">
          <text-truncate>
            {{ slotProps.data.name }}
          </text-truncate>
        </template>
      </Column>
      <Column :header="$t('settings.servers.status')" field="status" sortable style="width: 10%">
        <template #body="slotProps">
          <Tag
            v-if="slotProps.data.status === -1"
            v-tooltip="$t('settings.servers.disabled')"
            :aria-label="$t('settings.servers.disabled')"
            class="p-2"
            severity="secondary"
          >
            <i class="fa-solid fa-pause"/>
          </Tag>
          <Tag
            v-else-if="slotProps.data.status === 0"
            v-tooltip="$t('settings.servers.offline')"
            :aria-label="$t('settings.servers.offline')"
            class="p-2"
            severity="danger"
          >
            <i class="fa-solid fa-stop"/>
          </Tag>
          <Tag
            v-else
            v-tooltip="$t('settings.servers.online')"
            :aria-label="$t('settings.servers.online')"
            class="p-2"
            severity="success"
          >
            <i class="fa-solid fa-play"/>
          </Tag>
        </template>
      </Column>
      <Column :header="$t('settings.servers.version')" field="version" sortable style="width: 10%">
        <template #body="slotProps">
          <span v-if="slotProps.data.version !== null">{{ slotProps.data.version }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.meeting_count')" field="meeting_count" sortable style="width: 15%">
        <template #body="slotProps">
          <span v-if="slotProps.data.meeting_count !== null">{{ slotProps.data.meeting_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.participant_count')" field="participant_count" sortable style="width: 15%">
        <template #body="slotProps">
          <span v-if="slotProps.data.participant_count !== null">{{ slotProps.data.participant_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.video_count')" field="video_count" sortable style="width: 15%">
        <template #body="slotProps">
          <span v-if="slotProps.data.video_count !== null">{{ slotProps.data.video_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              :disabled="isBusy"
              v-tooltip="$t('settings.servers.view', { name: slotProps.data.name })"
              :to="{ name: 'settings.servers.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
              class="p-button p-button-info"
            >
              <i class="fa-solid fa-eye"/>
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              :disabled="isBusy"
              v-tooltip="$t('settings.servers.edit', { name: slotProps.data.name })"
              :to="{ name: 'settings.servers.view', params: { id: slotProps.data.id } }"
              class="p-button p-button-secondary"
            >
              <i class="fa-solid fa-edit"/>
            </router-link>
            <SettingsServersDeleteButton
              v-if="userPermissions.can('delete', slotProps.data) && slotProps.data.status===-1"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData"
            ></SettingsServersDeleteButton>
          </div>
        </template>
      </Column>
    </DataTable>

    <!--      ToDo find better solution???-->
    <InlineNote severity="info" class="mt-2 w-full">
<!--      <i class="fa-solid fa-info-circle"/>-->
      {{ $t('settings.servers.usage_info') }}
      <br><br>
      <Button
        :disabled="isBusy"
        size="sm"
        severity="info"
        @click="updateUsage=true;loadData();"
      >
        <i class="fa-solid fa-sync"/> {{ $t('settings.servers.reload') }}
      </Button>
    </InlineNote>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { onMounted, ref } from 'vue';

const api = useApi();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const loadingError = ref(false);
const servers = ref([]);
const currentPage = ref(1);
const sortField = ref('id');
const sortOrder = ref(1);
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});
const filter = ref(undefined);
const updateUsage = ref(false);

onMounted(() => {
  loadData();
});

/**
 * Loads the servers from the backend
 *
 */
function loadData () {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: currentPage.value,
      update_sage: updateUsage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      name: filter.value
    }
  };

  api.call('servers', config).then(response => {
    servers.value = response.data.data;
    meta.value = response.data.meta;
  }).catch(error => {
    api.error(error);
    loadingError.value = true;
  }).finally(() => {
    isBusy.value = false;
    updateUsage.value = false;
  });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort () {
  // ToDo check if solves problem
  currentPage.value = 1;
  loadData();
}

</script>
