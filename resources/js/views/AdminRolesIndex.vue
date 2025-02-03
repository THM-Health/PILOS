<template>
  <div>
    <div class="mb-6 flex flex-col justify-between md:flex-row">
      <div>
        <InputGroup data-test="role-search">
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
        v-if="userPermissions.can('create', 'RolePolicy')"
        v-tooltip="$t('admin.roles.new')"
        as="router-link"
        icon="fa-solid fa-plus"
        :aria-label="$t('admin.roles.new')"
        :to="{ name: 'admin.roles.new' }"
        data-test="roles-add-button"
      />
    </div>

    <DataTable
      v-model:sort-field="sortField"
      v-model:sort-order="sortOrder"
      :total-records="paginator.getTotalRecords()"
      :rows="paginator.getRows()"
      :first="paginator.getFirst()"
      :value="roles"
      lazy
      data-key="id"
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      :loading="isBusy || loadingError"
      row-hover
      striped-rows
      :pt="{
        table: 'table-auto lg:table-fixed',
        bodyRow: {
          'data-test': 'role-item',
        },
        mask: {
          'data-test': 'overlay',
        },
        column: {
          bodyCell: {
            'data-test': 'role-item-cell',
          },
          headerCell: {
            'data-test': 'role-header-cell',
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
      <!-- Show message on empty role list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
            $t("admin.roles.no_data")
          }}</InlineNote>
          <InlineNote v-else>{{
            $t("admin.roles.no_data_filtered")
          }}</InlineNote>
        </div>
      </template>

      <Column field="name" :header="$t('app.model_name')" sortable>
        <template #body="slotProps">
          <div class="flex flex-row items-center gap-2">
            <TextTruncate>
              {{ slotProps.data.name }}
            </TextTruncate>
            <Tag
              v-if="slotProps.data.superuser"
              icon="fa-solid fa-crown"
              :value="$t('admin.roles.superuser')"
              severity="warn"
            />
          </div>
        </template>
      </Column>
      <Column
        v-if="actionColumn.visible"
        :header="$t('app.actions')"
        class="action-column"
        :class="actionColumn.classes"
      >
        <template #body="slotProps">
          <div>
            <Button
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="$t('admin.roles.view', { name: slotProps.data.name })"
              as="router-link"
              :aria-label="
                $t('admin.roles.view', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.roles.view',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-eye"
              data-test="roles-view-button"
            />
            <Button
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="$t('admin.roles.edit', { name: slotProps.data.name })"
              as="router-link"
              severity="info"
              :aria-label="
                $t('admin.roles.edit', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.roles.edit',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-edit"
              data-test="roles-edit-button"
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
import { useApi } from "../composables/useApi.js";
import { onMounted, ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useActionColumn } from "../composables/useActionColumn.js";
import { usePaginator } from "../composables/usePaginator.js";

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const actionColumn = useActionColumn([
  { permissions: ["roles.view"] },
  { permissions: ["roles.update"] },
  { permissions: ["roles.delete"] },
]);

const isBusy = ref(false);
const loadingError = ref(false);
const roles = ref([]);
const sortField = ref("name");
const sortOrder = ref(1);
const filter = ref(undefined);

onMounted(() => {
  loadData();
});

/**
 * Loads the roles from the backend
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
    .call("roles", config)
    .then((response) => {
      roles.value = response.data.data;
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
