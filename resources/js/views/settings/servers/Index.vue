<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>
        {{ $t('app.servers') }}
      </h2>
      <router-link
        v-if="userPermissions.can('create', 'ServerPolicy')"
        v-tooltip="$t('settings.servers.new')"
        :aria-label="$t('settings.servers.new')"
        :to="{ name: 'settings.servers.view', params: { id: 'new' } }"
        class="p-button p-button-icon-only p-button-success"
      >
        <i class="fa-solid fa-plus"/>
      </router-link>
    </div>

    <div class="flex flex-column md:flex-row justify-content-between">
      <div>
        <InputGroup>
          <InputText
            v-model="filter"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData()"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            severity="primary"
            @click="loadData()"
          />
        </InputGroup>
      </div>
      <div class="flex gap-2 justify-content-between  mt-2">
        <Button
          :disabled="isBusy"
          severity="info"
          @click="loadData(true);"
          icon="fa-solid fa-repeat"
          :label="$t('settings.servers.reload')"
        />
        <Button
          :disabled="isBusy"
          severity="secondary"
          @click="loadData();"
          icon="fa-solid fa-sync"
          v-tooltip="$t('app.reload')"
          :aria-label="$t('app.reload')"
        />
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
      stripedRows
      @page="onPage"
      @sort="onSort"
      class="table-auto lg:table-fixed"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData()"/>
      </template>
      <!-- Show message on empty server list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="meta.total_no_filter === 0">{{ $t('settings.servers.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('settings.servers.no_data_filtered') }}</InlineNote>
        </div>
      </template>
      <Column :header="$t('app.model_name')" field="name" sortable>
        <template #body="slotProps">
          <TextTruncate>
            {{ slotProps.data.name }}
          </TextTruncate>
        </template>
      </Column>
      <Column :header="$t('settings.servers.status')" field="status" sortable>
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
      <Column :header="$t('settings.servers.version')" field="version" sortable>
        <template #body="slotProps">
          <span v-if="slotProps.data.version !== null">{{ slotProps.data.version }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.meeting_count')" field="meeting_count" sortable>
        <template #body="slotProps">
          <span v-if="slotProps.data.meeting_count !== null">{{ slotProps.data.meeting_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.participant_count')" field="participant_count" sortable>
        <template #body="slotProps">
          <span v-if="slotProps.data.participant_count !== null">{{ slotProps.data.participant_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('settings.servers.video_count')" field="video_count" sortable>
        <template #body="slotProps">
          <span v-if="slotProps.data.video_count !== null">{{ slotProps.data.video_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
      </Column>
      <Column :header="$t('app.actions')"  :class="actionColumn.classes" v-if="actionColumn.visible">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              :disabled="isBusy"
              v-tooltip="$t('settings.servers.view', { name: slotProps.data.name })"
              :aria-label="$t('settings.servers.view', { name: slotProps.data.name })"
              :to="{ name: 'settings.servers.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
              class="p-button p-button-info p-button-icon-only"
            >
              <i class="fa-solid fa-eye"/>
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              :disabled="isBusy"
              v-tooltip="$t('settings.servers.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.servers.edit', { name: slotProps.data.name })"
              :to="{ name: 'settings.servers.view', params: { id: slotProps.data.id } }"
              class="p-button p-button-secondary p-button-icon-only"
            >
              <i class="fa-solid fa-edit"/>
            </router-link>
            <SettingsServersDeleteButton
              v-if="userPermissions.can('delete', slotProps.data) && slotProps.data.status===-1"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData()"
            ></SettingsServersDeleteButton>
          </div>
        </template>
      </Column>
    </DataTable>

    <InlineNote severity="info" class="mt-2 w-full">
      {{ $t('settings.servers.usage_info') }}
    </InlineNote>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useActionColumn } from '@/composables/useActionColumn.js';
import { onMounted, ref } from 'vue';

const api = useApi();
const userPermissions = useUserPermissions();
const actionColumn = useActionColumn([{ permissions: ['servers.view'] }, { permissions: ['servers.update'] }, { permissions: ['servers.delete'] }]);

const isBusy = ref(false);
const loadingError = ref(false);
const servers = ref([]);
const currentPage = ref(1);
const sortField = ref('name');
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

onMounted(() => {
  loadData();
});

/**
 * Loads the servers from the backend
 *
 */
function loadData (updateUsage = false) {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: currentPage.value,
      update_usage: updateUsage,
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
  });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort () {
  currentPage.value = 1;
  loadData();
}

</script>
