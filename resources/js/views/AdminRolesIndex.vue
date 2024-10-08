<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between mb-6">
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

      <Button
        as="router-link"
        v-if="userPermissions.can('create', 'RolePolicy')"
        icon="fa-solid fa-plus"
        v-tooltip="$t('admin.roles.new')"
        :aria-label="$t('admin.roles.new')"
        :to="{ name: 'admin.roles.new' }"
      />
    </div>

    <DataTable
      :totalRecords="paginator.getTotalRecords()"
      :rows="paginator.getRows()"
      :first="paginator.getFirst()"
      @update:first="paginator.setFirst($event)"
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
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{ $t('admin.roles.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('admin.roles.no_data_filtered') }}</InlineNote>
        </div>
      </template>

      <Column field="name" :header="$t('app.model_name')" sortable>
        <template #body="slotProps">
          <div class="flex flex-row gap-2 items-center">
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
            <Button
              as="router-link"
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="$t('admin.roles.view', { name: slotProps.data.name })"
              :aria-label="$t('admin.roles.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'admin.roles.view', params: { id: slotProps.data.id } }"
              icon="fa-solid fa-eye"
            />
            <Button
              as="router-link"
              v-if="userPermissions.can('update', slotProps.data)"
              severity="info"
              v-tooltip="$t('admin.roles.edit', { name: slotProps.data.name })"
              :aria-label="$t('admin.roles.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'admin.roles.edit', params: { id: slotProps.data.id } }"
              icon="fa-solid fa-edit"
            />
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
import { useApi } from '../composables/useApi.js';
import { onMounted, ref } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useActionColumn } from '../composables/useActionColumn.js';
import { usePaginator } from '../composables/usePaginator.js';

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
    paginator.revertFirst();
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
