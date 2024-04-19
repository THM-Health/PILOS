<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>
        {{ $t('app.roles') }}
      </h2>
      <router-link
        v-if="userPermissions.can('create', 'RolePolicy')"
        class="p-button p-button-success p-button-icon-only"
        v-tooltip="$t('settings.roles.new')"
        :aria-label="$t('settings.roles.new')"
        :to="{ name: 'settings.roles.view', params: { id: 'new' } }"
      >
        <i class="fa-solid fa-plus" />
      </router-link>
    </div>

    <div class="flex flex-column md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="filter"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData(1)"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            severity="primary"
            @click="loadData(1)"
            icon="fa-solid fa-magnifying-glass"
          />
        </InputGroup>
      </div>
    </div>
    <Divider/>

    <DataTable
      :totalRecords="paginator.getTotalRecords()"
      :rows="paginator.getRows()"
      :first="paginator.getFirst()"
      :value="roles"
      lazy
      dataKey="id"
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      :loading="isBusy || loadingError"
      rowHover
      stripedRows
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      @page="onPage"
      @sort="onSort"
      class="table-auto lg:table-fixed"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <!-- Show message on empty role list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{ $t('settings.roles.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('settings.roles.no_data_filtered') }}</InlineNote>
        </div>
      </template>

      <Column field="name" :header="$t('app.model_name')" sortable>
        <template #body="slotProps">
          <div class="flex flex-row gap-2 align-items-center">
            <TextTruncate>
              {{ slotProps.data.name }}
            </TextTruncate>
            <Tag icon="fa-solid fa-crown" value="Superuser" v-if="slotProps.data.superuser" />
          </div>
        </template>
      </Column>
      <Column :header="$t('app.actions')" class="action-column" :class="actionColumn.classes" v-if="actionColumn.visible">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              class="p-button p-button-info p-button-icon-only"
              v-tooltip="$t('settings.roles.view', { name: slotProps.data.name })"
              :aria-label="$t('settings.roles.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.roles.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              class="p-button p-button-secondary p-button-icon-only"
              v-tooltip="$t('settings.roles.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.roles.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.roles.view', params: { id: slotProps.data.id } }"
            >
              <i class="fa-solid fa-edit" />
            </router-link>
            <SettingsRolesDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData()"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { onMounted, ref } from 'vue';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useActionColumn } from '@/composables/useActionColumn.js';
import { usePaginator } from '../../../composables/usePaginator.js';

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const actionColumn = useActionColumn([{ permissions: ['roles.view'] }, { permissions: ['roles.update'] }, { permissions: ['roles.delete'] }]);

const isBusy = ref(false);
const loadingError = ref(false);
const roles = ref([]);
const sortField = ref('name');
const sortOrder = ref(1);
const filter = ref(undefined);

onMounted(() => {
  loadData();
});

/**
 * Loads the roles from the backend
 *
 */
function loadData (page = null) {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      name: filter.value
    }
  };

  api.call('roles', config).then(response => {
    roles.value = response.data.data;
    paginator.updateMeta(response.data.meta).then(() => {
      if (paginator.isOutOfRange()) {
        loadData(paginator.getLastPage());
      }
    });
  }).catch(error => {
    api.error(error);
    loadingError.value = true;
  }).finally(() => {
    isBusy.value = false;
  });
}

function onPage (event) {
  loadData(event.page + 1);
}

function onSort () {
  loadData(1);
}

</script>
