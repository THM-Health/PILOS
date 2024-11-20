<template>
  <div>
    <div class="mb-6 flex flex-col justify-between md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="nameSearch"
            :placeholder="$t('app.search')"
            @keyup.enter="filters['name'].value = nameSearch"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            severity="primary"
            @click="filters['name'].value = nameSearch"
          />
        </InputGroup>
      </div>
      <Button
        v-if="userPermissions.can('create', 'RoomTypePolicy')"
        v-tooltip="$t('admin.room_types.new')"
        as="router-link"
        icon="fa-solid fa-plus"
        :to="{ name: 'admin.room_types.new' }"
      />
    </div>

    <DataTable
      v-model:filters="filters"
      :value="roomTypes"
      sort-field="name"
      :sort-order="1"
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      striped-rows
      row-hover
      :loading="isBusy"
      :rows="settingsStore.getSetting('general.pagination_page_size')"
      :pt="{
        table: 'table-auto lg:table-fixed',
      }"
    >
      <template #empty>
        <InlineNote v-if="roomTypes.length === 0">{{
          $t("admin.room_types.no_data")
        }}</InlineNote>
        <InlineNote v-else>{{
          $t("admin.room_types.no_data_filtered")
        }}</InlineNote>
      </template>
      <Column
        key="name"
        field="name"
        :header="$t('app.model_name')"
        :sortable="true"
      >
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.name }}</TextTruncate>
        </template>
      </Column>
      <Column
        v-if="actionColumn.visible"
        field="actions"
        :header="$t('app.actions')"
        class="action-column"
        :class="actionColumn.classes"
      >
        <template #body="slotProps">
          <div>
            <Button
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="
                $t('admin.room_types.view', { name: slotProps.data.name })
              "
              as="router-link"
              :aria-label="
                $t('admin.room_types.view', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.room_types.view',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-eye"
            />
            <Button
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="
                $t('admin.room_types.edit', { name: slotProps.data.name })
              "
              as="router-link"
              severity="info"
              :aria-label="
                $t('admin.room_types.edit', { name: slotProps.data.name })
              "
              :disabled="isBusy"
              :to="{
                name: 'admin.room_types.edit',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-edit"
            />
            <SettingsRoomTypesDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData()"
              @not-found="loadData()"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useSettingsStore } from "../stores/settings";
import { useActionColumn } from "../composables/useActionColumn.js";
import { usePaginator } from "../composables/usePaginator.js";

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const actionColumn = useActionColumn([
  { permissions: ["roomTypes.view"] },
  { permissions: ["roomTypes.update"] },
  { permissions: ["roomTypes.delete"] },
]);

const isBusy = ref(false);
const roomTypes = ref([]);
const nameSearch = ref("");
const filters = ref({
  name: { value: null, matchMode: "contains" },
});

onMounted(() => {
  loadData();
});

/**
 * Loads the roles from the backend and calls on finish the callback function.
 */
function loadData() {
  isBusy.value = true;
  api
    .call("roomTypes")
    .then((response) => {
      roomTypes.value = response.data.data;
    })
    .catch((error) => {
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>
