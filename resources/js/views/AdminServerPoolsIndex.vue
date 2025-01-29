<template>
  <div>
    <div class="mb-6 flex flex-col justify-between md:flex-row">
      <div>
        <InputGroup data-test="server-pool-search">
          <InputText
            v-model="filter"
            :disabled="isBusy"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData(1)"
          />
          <Button
            v-tooltip="$t('app.search')"
            :disabled="isBusy"
            :aria-label="$t('app.search')"
            severity="primary"
            icon="fa-solid fa-magnifying-glass"
            @click="loadData(1)"
          />
        </InputGroup>
      </div>
      <Button
        v-if="userPermissions.can('create', 'ServerPoolPolicy')"
        v-tooltip="$t('admin.server_pools.new')"
        as="router-link"
        icon="fa-solid fa-plus"
        :aria-label="$t('admin.server_pools.new')"
        :to="{ name: 'admin.server_pools.new' }"
        data-test="server-pools-add-button"
      />
    </div>

    <DataTable
      v-model:sort-field="sortField"
      v-model:sort-order="sortOrder"
      :loading="isBusy || loadingError"
      :rows="paginator.getRows()"
      :total-records="paginator.getTotalRecords()"
      :first="paginator.getFirst()"
      :value="serverPools"
      data-key="id"
      lazy
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      row-hover
      striped-rows
      :pt="{
        table: 'table-auto lg:table-fixed',
        bodyRow: {
          'data-test': 'server-pool-item',
        },
        mask: {
          'data-test': 'overlay',
        },
        column: {
          bodyCell: {
            'data-test': 'server-pool-item-cell',
          },
          headerCell: {
            'data-test': 'server-pool-header-cell',
          },
        },
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
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <!-- Show message on empty server pool list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
            $t("admin.server_pools.no_data")
          }}</InlineNote>
          <InlineNote v-else>{{
            $t("admin.server_pools.no_data_filtered")
          }}</InlineNote>
        </div>
      </template>
      <Column :header="$t('app.model_name')" field="name" sortable>
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.name }}</TextTruncate>
        </template>
      </Column>
      <Column
        :header="$t('admin.server_pools.server_count')"
        field="servers_count"
        sortable
      ></Column>
      <Column
        v-if="actionColumn.visible"
        :header="$t('app.actions')"
        :class="actionColumn.classes"
      >
        <template #body="slotProps">
          <div>
            <Button
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="
                $t('admin.server_pools.view', { name: slotProps.data.name })
              "
              as="router-link"
              :aria-label="
                $t('admin.server_pools.view', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.server_pools.view',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-eye"
              data-test="server-pools-view-button"
            />
            <Button
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="
                $t('admin.server_pools.edit', { name: slotProps.data.name })
              "
              as="router-link"
              :aria-label="
                $t('admin.server_pools.edit', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.server_pools.edit',
                params: { id: slotProps.data.id },
              }"
              severity="info"
              icon="fa-solid fa-edit"
              data-test="server-pools-edit-button"
            />
            <SettingsServerPoolsDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData()"
            >
            </SettingsServerPoolsDeleteButton>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useActionColumn } from "../composables/useActionColumn.js";
import { onMounted, ref } from "vue";
import { usePaginator } from "../composables/usePaginator.js";

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const actionColumn = useActionColumn([
  { permissions: ["serverPools.view"] },
  { permissions: ["serverPools.update"] },
  { permissions: ["serverPools.delete"] },
]);

const isBusy = ref(false);
const loadingError = ref(false);
const serverPools = ref([]);
const sortField = ref("name");
const sortOrder = ref(1);
const filter = ref(undefined);

onMounted(() => {
  loadData();
});

/**
 * Loads the server pools from the backend
 *
 */
function loadData(page = null) {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      name: filter.value,
    },
  };

  api
    .call("serverPools", config)
    .then((response) => {
      serverPools.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      paginator.revertFirst();
      api.error(error);
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

function onSort() {
  loadData(1);
}
</script>
