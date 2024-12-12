<template>
  <div>
    <div class="flex flex-col justify-between md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="filter"
            :disabled="isBusy"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData(1, false)"
          />
          <Button
            v-tooltip="$t('app.search')"
            :disabled="isBusy"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            severity="primary"
            @click="loadData(1, false)"
          />
        </InputGroup>
      </div>
      <div class="mt-2 flex justify-between gap-2">
        <Button
          :disabled="isBusy"
          severity="info"
          icon="fa-solid fa-repeat"
          :label="$t('admin.servers.reload')"
          @click="loadData(null, true)"
        />
        <Button
          v-tooltip="$t('app.reload')"
          :disabled="isBusy"
          severity="secondary"
          icon="fa-solid fa-sync"
          :aria-label="$t('app.reload')"
          @click="loadData(null, false)"
        />
        <Button
          v-if="userPermissions.can('create', 'ServerPolicy')"
          v-tooltip="$t('admin.servers.new')"
          as="router-link"
          :aria-label="$t('admin.servers.new')"
          :to="{ name: 'admin.servers.new' }"
          icon="fa-solid fa-plus"
        />
      </div>
    </div>
    <Divider />
    <DataTable
      v-model:sort-field="sortField"
      v-model:sort-order="sortOrder"
      :loading="isBusy || loadingError"
      :total-records="paginator.getTotalRecords()"
      :rows="paginator.getRows()"
      :first="paginator.getFirst()"
      :value="servers"
      data-key="id"
      lazy
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      row-hover
      striped-rows
      :pt="{
        table: 'table-auto lg:table-fixed',
      }"
      @update:first="paginator.setFirst($event)"
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton
          :error="loadingError"
          @reload="loadData(null, false)"
        />
      </template>
      <!-- Show message on empty server list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
            $t("admin.servers.no_data")
          }}</InlineNote>
          <InlineNote v-else>{{
            $t("admin.servers.no_data_filtered")
          }}</InlineNote>
        </div>
      </template>
      <Column :header="$t('app.model_name')" field="name" sortable>
        <template #body="slotProps">
          <TextTruncate>
            {{ slotProps.data.name }}
          </TextTruncate>
        </template>
      </Column>
      <Column :header="$t('admin.servers.status')" field="status" sortable>
        <template #body="slotProps">
          <Tag
            v-if="slotProps.data.status === -1"
            v-tooltip="$t('admin.servers.disabled')"
            :aria-label="$t('admin.servers.disabled')"
            class="p-2"
            severity="danger"
          >
            <i class="fa-solid fa-stop" />
          </Tag>
          <Tag
            v-else-if="slotProps.data.status === 0"
            v-tooltip="$t('admin.servers.draining')"
            :aria-label="$t('admin.servers.draining')"
            class="p-2"
            severity="info"
          >
            <i class="fa-solid fa-pause" />
          </Tag>
          <Tag
            v-else
            v-tooltip="$t('admin.servers.enabled')"
            :aria-label="$t('admin.servers.enabled')"
            class="p-2"
            severity="success"
          >
            <i class="fa-solid fa-play" />
          </Tag>
        </template>
      </Column>
      <Column :header="$t('admin.servers.connection')" field="health">
        <template #body="slotProps">
          <Tag
            v-if="slotProps.data.health === -1"
            v-tooltip="$t('admin.servers.offline')"
            :aria-label="$t('admin.servers.offline')"
            class="p-2"
            severity="danger"
          >
            <i class="fa-solid fa-xmark" />
          </Tag>
          <Tag
            v-else-if="slotProps.data.health === 0"
            v-tooltip="$t('admin.servers.unhealthy')"
            :aria-label="$t('admin.servers.unhealthy')"
            class="p-2"
            severity="warning"
          >
            <i class="fa-solid fa-triangle-exclamation" />
          </Tag>
          <Tag
            v-else-if="slotProps.data.health === 1"
            v-tooltip="$t('admin.servers.online')"
            :aria-label="$t('admin.servers.online')"
            class="p-2"
            severity="success"
          >
            <i class="fa-solid fa-check" />
          </Tag>
          <raw-text v-else> --- </raw-text>
        </template>
      </Column>
      <Column :header="$t('admin.servers.version')" field="version" sortable>
        <template #body="slotProps">
          <span v-if="slotProps.data.version !== null">{{
            slotProps.data.version
          }}</span>
          <raw-text v-else> --- </raw-text>
        </template>
      </Column>
      <Column
        :header="$t('admin.servers.meeting_count')"
        field="meeting_count"
        sortable
      >
        <template #body="slotProps">
          <span v-if="slotProps.data.meeting_count !== null">{{
            slotProps.data.meeting_count
          }}</span>
          <raw-text v-else> --- </raw-text>
        </template>
      </Column>
      <Column
        :header="$t('admin.servers.participant_count')"
        field="participant_count"
        sortable
      >
        <template #body="slotProps">
          <span v-if="slotProps.data.participant_count !== null">{{
            slotProps.data.participant_count
          }}</span>
          <raw-text v-else> --- </raw-text>
        </template>
      </Column>
      <Column
        :header="$t('admin.servers.video_count')"
        field="video_count"
        sortable
      >
        <template #body="slotProps">
          <span v-if="slotProps.data.video_count !== null">{{
            slotProps.data.video_count
          }}</span>
          <raw-text v-else> --- </raw-text>
        </template>
      </Column>
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
                $t('admin.servers.view', { name: slotProps.data.name })
              "
              as="router-link"
              :disabled="isBusy"
              :aria-label="
                $t('admin.servers.view', { name: slotProps.data.name })
              "
              :to="{
                name: 'admin.servers.view',
                params: { id: slotProps.data.id },
              }"
              icon="fa-solid fa-eye"
            />
            <Button
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="
                $t('admin.servers.edit', { name: slotProps.data.name })
              "
              as="router-link"
              :disabled="isBusy"
              :aria-label="
                $t('admin.servers.edit', { name: slotProps.data.name })
              "
              :to="{
                name: 'admin.servers.edit',
                params: { id: slotProps.data.id },
              }"
              severity="info"
              icon="fa-solid fa-edit"
            />
            <SettingsServersDeleteButton
              v-if="
                userPermissions.can('delete', slotProps.data) &&
                slotProps.data.status === -1
              "
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData(null, false)"
            ></SettingsServersDeleteButton>
          </div>
        </template>
      </Column>
    </DataTable>

    <InlineNote severity="info" class="mt-2 w-full">
      {{ $t("admin.servers.usage_info") }}
    </InlineNote>
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
  { permissions: ["servers.view"] },
  { permissions: ["servers.update"] },
  { permissions: ["servers.delete"] },
]);

const isBusy = ref(false);
const loadingError = ref(false);
const servers = ref([]);
const sortField = ref("name");
const sortOrder = ref(1);
const filter = ref(undefined);

onMounted(() => {
  loadData(null, false);
});

/**
 * Loads the servers from the backend
 *
 */
function loadData(page = null, updateUsage = false) {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      update_usage: updateUsage,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      name: filter.value,
    },
  };

  api
    .call("servers", config)
    .then((response) => {
      servers.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage(), false);
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
  loadData(event.page + 1, false);
}

function onSort() {
  loadData(1, false);
}
</script>
